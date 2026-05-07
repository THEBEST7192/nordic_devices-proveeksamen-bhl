import postgres from 'postgres';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Last miljøvariabler fra prosjektrot
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function prompt(question, hidden = false) {
  if (hidden) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      let password = '';
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
  console.log('Opprett ny konto');
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

  // Bruk Docker miljøvariabler for database tilkobling
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'nettside_mal';
  const dbUser = 'postgres'; // Alltid bruk postgres for Docker
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbPassword) {
    console.error('DB_PASSWORD mangler! Sett DB_PASSWORD miljøvariabel.');
    process.exit(1);
  }

  const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  let sql;
  try {
    sql = postgres(connectionString);

    // Hash passordet
    const passwordHash = await bcrypt.hash(password, 10);

    // Sjekk om bruker allerede eksisterer
    const existing = await sql`SELECT * FROM doctors WHERE username = ${username}`;
    if (existing.length > 0) {
      console.log(`Feil: Brukeren "${username}" eksisterer allerede.`);
      process.exit(1);
    }

    // Opprett ny lege
    await sql`
      INSERT INTO doctors (username, password_hash)
      VALUES (${username}, ${passwordHash})
    `;

    console.log(`Lege "${username}" ble opprettet!`);
  } catch (error) {
    console.error('Feil ved opprettelse av lege:', error);
    process.exit(1);
  } finally {
    await sql?.end();
  }
}

createDoctor();
