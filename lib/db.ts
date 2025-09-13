// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // set in Vercel
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};
