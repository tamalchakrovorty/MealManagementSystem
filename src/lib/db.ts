import { Pool, types } from "pg";

types.setTypeParser(20, (v) => parseInt(v, 10));

const connectionString = process.env.DATABASE_URL || "";

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: connectionString.includes("cockroachlabs.cloud")
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function queryScalar<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<{ result: T }>(text, params);
  return rows[0]?.result ?? null;
}

export { pool };
