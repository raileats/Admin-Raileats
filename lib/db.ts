// lib/db.ts
import pkg from 'pg';
const { Pool } = pkg;

let pool;

if (!global.__pgPool) {
  global.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Supabase
    // optionally set max: 1 or small pool for serverless, e.g. max: 2
  });
}

pool = global.__pgPool;

export default {
  query: (text, params) => pool.query(text, params),
  pool, // optional export if you need pool.connect()
};
