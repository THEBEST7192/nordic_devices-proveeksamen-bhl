import sql from './db.js';
import bcrypt from 'bcrypt';
import readline from 'readline';

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
  console.log('Opprett ny lege-konto');
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
    console.log(`Brukernavn: ${username}`);
    console.log(`Passord: ${password}`);
    
  } catch (error) {
    console.error('Feil ved opprettelse av lege:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createDoctor();
