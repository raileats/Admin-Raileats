// app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

// Pool create with DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase ke liye
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();

    return NextResponse.json({
      success: true,
      time: result.rows[0].now,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}
