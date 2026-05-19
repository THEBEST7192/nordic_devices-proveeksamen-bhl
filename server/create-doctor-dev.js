import bcrypt from 'bcrypt';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load development environment
dotenv.config({ path: path.resolve(__dirname, '..', '.env.development') });

// Create direct database connection for development
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  database: process.env.DB_NAME || 'nordic_devices_proveeksamen_dev',
  user: process.env.DB_USER || 'not_root',
  password: process.env.DB_ROOT_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

async function prompt(question, hidden = false) {
  if (hidden) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });

      // Skjul input ved å erstatte med stjerner
      rl._writeToOutput = (string) => {
        if (string === '\r\n' || string === '\n' || string === '\r') {
          rl.output.write(string);
        } else {
          rl.output.write('*'.repeat(string.length));
        }
      };
    });
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

async function createDoctor() {
  console.log('Opprett ny administrator for DEVELOPMENT');
  console.log('Database: nettside_mal_dev');
  console.log('');

  const username = await prompt('Brukernavn: ');
  const password = await prompt('Passord: ', true);

  if (!username || !password) {
    console.log('Feil: Brukernavn og passord er påkrevd');
    console.log('');
    console.log('Krav:');
    console.log('  - Brukernavn: Unikt, minst 3 tegn');
    console.log('  - Passord: Minst 8 tegn, anbefalt med tall og spesialtegn');
    process.exit(1);
  }

  try {
    // Hash passordet
    const passwordHash = await bcrypt.hash(password, 10);

    // Sjekk om bruker allerede eksisterer
    const existing = await query('SELECT * FROM doctors WHERE username = ?', [username]);
    if (existing.length > 0) {
      console.log(`Feil: Brukeren "${username}" eksisterer allerede.`);
      process.exit(1);
    }

    // Opprett ny administrator
    await query(
      'INSERT INTO doctors (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );
    
    console.log(`Admin "${username}" ble opprettet i development database!`);
    process.exit(0);
    
  } catch (error) {
    console.error('Feil ved opprettelse av administrator:', error);
    process.exit(1);
  }
}

createDoctor();
