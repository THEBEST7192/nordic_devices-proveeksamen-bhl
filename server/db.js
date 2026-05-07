import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Last miljøvariabler før databasen initialiseres
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

// Last deretter fra prosjektrot (for Docker)
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });

// Bruk DATABASE_URL hvis tilgjengelig, ellers bygg fra individuelle variabler
let connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/[\s`"']/g, '') : null;

// Hvis ingen DATABASE_URL, bygg fra individuelle variabler (for Docker)
if (!connectionString) {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'nettside_mal';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbPassword) {
    console.error('KRITISK: DB_PASSWORD mangler i miljøvariablene!');
  } else {
    connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    console.log(`Bygger connection string: postgresql://${dbUser}:****@${dbHost}:${dbPort}/${dbName}`);
  }
}

if (!connectionString) {
  console.error('KRITISK: Database tilkobling mangler!');
} else {
  const maskedUrl = connectionString.replace(/:([^@:]+)@/, ':****@');
  console.log(`Database-tilkoblingsstreng (renset) lastet: ${maskedUrl.substring(0, 30)}...`);
}

const sql = postgres(connectionString);

export default sql
