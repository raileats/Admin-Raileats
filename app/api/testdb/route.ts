import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query("SELECT NOW()");
    return NextResponse.json({ now: result.rows[0].now });
  } catch (err) {
    console.error("DB connection error:", err);
    return NextResponse.json({ error: "DB connection failed", details: String(err) }, { status: 500 });
  }
}
