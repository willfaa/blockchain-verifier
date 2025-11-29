// src/db.ts
import { Pool } from "pg";

// GANTI var di bawah ini sesuai kebutuhanmu
const pool = new Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "willfaa",
  database: "chainnesa_db",
});

// helper umum
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

// 🔹 helper khusus untuk cek koneksi DB
export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
