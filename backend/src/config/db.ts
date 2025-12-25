import { Pool } from "pg";
import "dotenv/config";

// STRICT ENV PARSING
const DB_HOST = process.env.DB_HOST || process.env.PGHOST || "localhost";
const DB_PORT = parseInt(
  process.env.DB_PORT || process.env.PGPORT || "5432",
  10
);
const DB_NAME = process.env.DB_NAME || process.env.PGDATABASE;
const DB_USER = process.env.DB_USER || process.env.PGUSER;
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.PGPASSWORD;

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  // Timeouts for cross-environment reliability
  connectionTimeoutMillis: 10000, // 10s
  idleTimeoutMillis: 30000,
});

// Event listener for errors on idle clients
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  // process.exit(-1); // Don't crash immediately, let the app decide
});

// Helper Umum
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } catch (err) {
    console.error(`❌ Query Failed: [${text}]`, err);
    throw err;
  } finally {
    client.release();
  }
}

// Helper Cek Koneksi
export async function testConnection(): Promise<void> {
  console.log(
    `⏳ Connecting to Postgres at ${DB_HOST}:${DB_PORT} (DB: ${DB_NAME})...`
  );
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT NOW() as now");
    console.log(`✅ Connection Success! Database time: ${res.rows[0].now}`);
  } catch (err: any) {
    console.error("❌ Connection Test Failed:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
export default prisma;
