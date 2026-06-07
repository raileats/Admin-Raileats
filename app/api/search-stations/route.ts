export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

function getEnv() {
  return {
    PROJECT_URL:
      process.env.SUPABASE_URL ||
      process
