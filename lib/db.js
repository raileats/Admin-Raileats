// lib/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase ke liye zaroori
});

export default {
  query: (text, params) => pool.query(text, params),
};
