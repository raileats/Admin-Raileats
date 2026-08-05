// app/api/hello/route.js
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, msg: "hello route working (app router)" });
}
