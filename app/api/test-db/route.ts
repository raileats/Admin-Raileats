// app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

// Supabase connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const client = await pool.connect();

    // Orders table se 5 rows uthao
    const result = await client.query(`
      SELECT id, status, outlet_name, station_name, delivery_datetime, customer_name, customer_mobile 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    client.release();

    return NextResponse.json({
      success: true,
      orders: result.rows,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}
