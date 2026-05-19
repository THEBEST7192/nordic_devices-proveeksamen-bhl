import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Last miljøvariabler før databasen initialiseres
// Bruk kun .env.development for utviklingsmiljø ellers bruk .env for produksjonsmiljø
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.development') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}

// Bygg databasekonfigurasjon fra miljøvariabler
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME || 'nordic_devices_proveeksamen';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.DB_ROOT_PASSWORD;

if (!dbPassword) {
  console.error('KRITISK: DB_PASSWORD eller DB_ROOT_PASSWORD mangler i miljøvariablene!');
} else {
  console.log(`Database-konfigurasjon: ${dbUser}:****@${dbHost}:${dbPort}/${dbName}`);
}

// Opprett connection pool
const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  database: dbPassword ? dbName : undefined,
  user: dbUser,
  password: dbPassword,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Hjelpefunksjon for å utføre spørringer
export const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// Hjelpefunksjon for å få en connection (for transaksjoner)
export const getConnection = async () => {
  return await pool.getConnection();
};

// Transaction hjelper
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;
