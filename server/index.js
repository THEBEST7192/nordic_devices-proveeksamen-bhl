import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, transaction } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Last env fra server katalog først (for lokal utvikling)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

// Last deretter fra prosjektrot (for Docker)
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });

const app = express();
const port = process.env.PORT || 6767;

const messageEncryptionKey = process.env.MESSAGE_ENCRYPTION_KEY
  ? process.env.MESSAGE_ENCRYPTION_KEY.replace(/[\s`"']/g, '')
  : null;
const messageEncryptionPrefix = 'enc:v1:';
const messageEncryptionAlgorithm = 'aes-256-gcm';

const getMessageKey = () => {
  if (!messageEncryptionKey) {
    throw new Error('MESSAGE_ENCRYPTION_KEY mangler');
  }
  const key = Buffer.from(messageEncryptionKey, 'base64');
  if (key.length !== 32) {
    throw new Error('MESSAGE_ENCRYPTION_KEY må være 32 bytes base64');
  }
  return key;
};

const encryptMessage = (value) => {
  if (!value) return value;
  const iv = crypto.randomBytes(12);
  const key = getMessageKey();
  const cipher = crypto.createCipheriv(messageEncryptionAlgorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  return `${messageEncryptionPrefix}${payload}`;
};

const decryptMessage = (value) => {
  if (!value) return value;
  if (!value.startsWith(messageEncryptionPrefix)) return value;
  const raw = Buffer.from(value.slice(messageEncryptionPrefix.length), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = getMessageKey();
  const decipher = crypto.createDecipheriv(messageEncryptionAlgorithm, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
};

// Stol på proxy-headere (nødvendig for Cloudflare/proxy)
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:8001', 'http://127.0.0.1:8001', 'https://helse.the-diddy.party'];

console.log('Serveren starter med tillatte origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/[\s`"']/g, '').replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.warn(`CORS AVVIST: "${origin}" er ikke i [${allowedOrigins.join(', ')}]`);
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Generell rate limiter for alle forespørsler
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'For mange forespørsler, vennligst prøv igjen senere.' }
});

// Strengere limiter for innlogging og reservasjoner
const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'For mange forsøk fra denne IP-adressen. Vennligst vent 10 minutter.' }
});

// Health check endepunkt
app.get('/api/health', globalLimiter, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(globalLimiter);
app.use(express.json());

// Server statiske frontend filer
app.use(express.static(path.join(__dirname, '..', 'dist')));

const initDb = async () => {
  try {
    // 1. Opprett tabeller for normaliserte data hvis de ikke eksisterer
    await query(`
      CREATE TABLE IF NOT EXISTS emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS phones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(255) UNIQUE NOT NULL
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email_id INT,
        phone_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails(id),
        FOREIGN KEY (phone_id) REFERENCES phones(id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Sjekk om det finnes noen leger, hvis ikke skriv ut en advarsel
    const doctors = await query('SELECT COUNT(*) as count FROM doctors');
    if (parseInt(doctors[0].count) === 0) {
      console.warn('ADVARSEL: Ingen leger er registrert i databasen. Systemet vil ikke tillate innlogging.');
      console.warn('Vennligst opprett en lege manuelt i "doctors"-tabellen.');
    }
    
    // Sjekk om reservations-tabellen har gammel struktur (med email-kolonne)
    const [tableInfo] = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reservations' AND column_name = 'email'
    `);

    if (tableInfo) {
      console.log('Gammel reservations-tabell oppdaget. Starter datamigrering...');
      
      await transaction(async (conn) => {
        // Hent alle gamle reservasjoner
        const oldReservations = await conn.execute('SELECT * FROM reservations');
        
        // Midlertidig tabell for å holde den nye strukturen
        await conn.execute(`
          CREATE TABLE reservations_new (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            date DATE NOT NULL,
            time TIME NOT NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        for (const res of oldReservations[0]) {
          const isEmail = res.email.includes('@');
          let emailId = null;
          let phoneId = null;

          if (isEmail) {
            await conn.execute(
              'INSERT INTO emails (email) VALUES (?) ON DUPLICATE KEY UPDATE email = VALUES(email)',
              [res.email]
            );
            const [emailRows] = await conn.execute('SELECT id FROM emails WHERE email = ?', [res.email]);
            emailId = emailRows[0].id;
          } else {
            await conn.execute(
              'INSERT INTO phones (phone) VALUES (?) ON DUPLICATE KEY UPDATE phone = VALUES(phone)',
              [res.email]
            );
            const [phoneRows] = await conn.execute('SELECT id FROM phones WHERE phone = ?', [res.email]);
            phoneId = phoneRows[0].id;
          }

          // Opprett bruker for denne reservasjonen
          await conn.execute(
            'INSERT INTO users (name, email_id, phone_id) VALUES (?, ?, ?)',
            [res.name, emailId, phoneId]
          );
          const [userRows] = await conn.execute('SELECT LAST_INSERT_ID() as id');
          const userId = userRows[0].id;
          
          // Sett inn i den nye reservasjonstabellen
          await conn.execute(
            'INSERT INTO reservations_new (user_id, date, time, message, created_at) VALUES (?, ?, ?, ?, ?)',
            [userId, res.date, res.time, encryptMessage(res.message), res.created_at]
          );
        }

        // Slett gammel tabell og gi nytt navn til den nye
        await conn.execute('DROP TABLE reservations');
        await conn.execute('ALTER TABLE reservations_new RENAME TO reservations');
      });
      
      console.log('Migrering fullført.');
    } else {
      // Hvis tabellen ikke eksisterer i det hele tatt, opprett den med det nye skjemaet
      await query(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          date DATE NOT NULL,
          time TIME NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    }
    
    console.log('Database initialisert med normalisert skjema');
    
    // Kjør initiell opprydding etter at tabeller er opprettet
    setTimeout(() => {
      cleanupOldReservations().catch(err => {
        console.error('Feil ved kjøring av første opprydding av reservasjoner:', err);
      });
    }, 3000); // Vent 3 sekunder for å sikre at tabeller er klare
  } catch (err) {
    console.error('Feil ved initialisering av database:', err);
  }
};

const reservationRetentionDaysEnv = parseInt(process.env.RESERVATION_RETENTION_DAYS || '1', 10); // 1 day, base 10
const reservationRetentionDays = Number.isNaN(reservationRetentionDaysEnv) ? 1 : reservationRetentionDaysEnv;
const cleanupIntervalMs = 24 * 60 * 60 * 1000;

const cleanupOldReservations = async () => {
  try {
    await transaction(async (conn) => {
      // 1. Slett gamle reservasjoner
      await conn.execute(
        'DELETE FROM reservations WHERE DATEDIFF(CURRENT_DATE, date) > ?',
        [reservationRetentionDays]
      );
      
      // 2. Slett brukere som ikke lenger har noen reservasjoner
      await conn.execute(`
        DELETE FROM users
        WHERE id NOT IN (SELECT user_id FROM reservations)
      `);
      
      // 3. Slett e-poster som ikke lenger er knyttet til noen bruker
      await conn.execute(`
        DELETE FROM emails
        WHERE id NOT IN (SELECT email_id FROM users WHERE email_id IS NOT NULL)
      `);
      
      // 4. Slett telefonnumre som ikke lenger er knyttet til noen bruker
      await conn.execute(`
        DELETE FROM phones
        WHERE id NOT IN (SELECT phone_id FROM users WHERE phone_id IS NOT NULL)
      `);
    });
    console.log(`Opprydding av gamle reservasjoner og tilhørende data fullført (oppbevaring ${reservationRetentionDays} dager)`);
  } catch (err) {
    console.error('Feil ved opprydding av gamle reservasjoner:', err);
  }
};

setInterval(() => {
  cleanupOldReservations().catch(err => {
    console.error('Feil i planlagt opprydding av reservasjoner:', err);
  });
}, cleanupIntervalMs);

app.get('/api/doctors/check', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM doctors');
    const count = parseInt(result[0].count);
    res.json({ hasDoctors: count > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Kunne ikke sjekke legestatus' });
  }
});

app.post('/api/login', strictLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Brukernavn og passord er påkrevd' });
  }

  try {
    const doctors = await query('SELECT * FROM doctors WHERE username = ?', [username]);
    const doctor = doctors[0];

    if (doctor && await bcrypt.compare(password, doctor.password_hash)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Feil brukernavn eller passord' });
    }
  } catch (err) {
    console.error('Innloggingsfeil:', err);
    res.status(500).json({ success: false, error: 'Intern serverfeil' });
  }
});

app.post('/api/reservations', strictLimiter, async (req, res) => {
  const { name, email, date, time, message } = req.body;

  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'Alle felt er obligatoriske' });
  }

  try {
    // Start en transaksjon
    const result = await transaction(async (conn) => {
      // Sjekk om det er e-post eller telefonnummer
      const isEmailAddress = email.includes('@');
      let emailId = null;
      let phoneId = null;

      if (isEmailAddress) {
        await conn.execute(
          'INSERT INTO emails (email) VALUES (?) ON DUPLICATE KEY UPDATE email = VALUES(email)',
          [email]
        );
        const [emailRows] = await conn.execute('SELECT id FROM emails WHERE email = ?', [email]);
        emailId = emailRows[0].id;
      } else {
        await conn.execute(
          'INSERT INTO phones (phone) VALUES (?) ON DUPLICATE KEY UPDATE phone = VALUES(phone)',
          [email]
        );
        const [phoneRows] = await conn.execute('SELECT id FROM phones WHERE phone = ?', [email]);
        phoneId = phoneRows[0].id;
      }

      // Opprett en ny brukerpost for denne reservasjonen
      await conn.execute(
        'INSERT INTO users (name, email_id, phone_id) VALUES (?, ?, ?)',
        [name, emailId, phoneId]
      );
      const [userRows] = await conn.execute('SELECT LAST_INSERT_ID() as id');
      const userId = userRows[0].id;

      const encryptedMessage = encryptMessage(message);
      await conn.execute(
        'INSERT INTO reservations (user_id, date, time, message) VALUES (?, ?, ?, ?)',
        [userId, date, time, encryptedMessage]
      );
      const [reservationRows] = await conn.execute(
        'SELECT * FROM reservations WHERE id = LAST_INSERT_ID()'
      );
      return reservationRows[0];
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Feil ved lagring av reservasjon:', err);
    res.status(500).json({ error: 'Intern serverfeil' });
  }
});

app.get('/api/reservations', async (req, res) => {
  const username = req.headers['x-username'];
  const password = req.headers['x-password'];

  if (!username || !password) {
    return res.status(401).json({ error: 'Uautorisert tilgang: Brukernavn og passord mangler' });
  }

  try {
    const doctors = await query('SELECT * FROM doctors WHERE username = ?', [username]);
    const doctor = doctors[0];

    if (!doctor || !(await bcrypt.compare(password, doctor.password_hash))) {
      return res.status(401).json({ error: 'Uautorisert tilgang: Feil legitimasjon' });
    }

    const reservations = await query(`
      SELECT 
        r.id, 
        u.name, 
        COALESCE(e.email, p.phone) as email,
        r.date, 
        r.time, 
        r.message, 
        r.created_at
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN emails e ON u.email_id = e.id
      LEFT JOIN phones p ON u.phone_id = p.id
      WHERE r.date > CURRENT_DATE 
      OR (r.date = CURRENT_DATE AND r.time >= CURRENT_TIME)
      ORDER BY r.date ASC, r.time ASC
    `);
    const decrypted = reservations.map((reservation) => ({
      ...reservation,
      message: decryptMessage(reservation.message)
    }));
    res.json(decrypted);
  } catch (err) {
    console.error('Feil ved henting av reservasjoner:', err);
    res.status(500).json({ 
      error: 'Intern serverfeil',
      message: err.message
    });
  }
});

app.get('/api/reservations/public', async (req, res) => {
  try {
    const reservations = await query(`
      SELECT date, time FROM reservations 
      WHERE date > CURRENT_DATE 
      OR (date = CURRENT_DATE AND time >= CURRENT_TIME)
      ORDER BY date ASC, time ASC
    `);
    res.json(reservations);
  } catch (err) {
    console.error('DATABASEFEIL på /api/reservations/public:', err);
    res.status(500).json({ 
      error: 'Intern serverfeil', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Server React app for client-side routing (catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Global feilhåndtering
app.use((err, req, res, next) => {
  console.error('Uhåndtert feil:', err);
  res.status(500).json({ 
    error: 'Intern serverfeil',
    message: err.message 
  });
});

app.listen(port, () => {
  console.log(`Serveren kjører på port ${port}`);
});

// Initialiser databasetabeller
initDb();
