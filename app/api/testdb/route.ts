// app/api/testdb/route.ts
import { db } from "../../lib/db";

export async function GET() {
  const { data, error } = await db.from("Stations").select("*").limit(1);
  return Response.json({ data, error });
}
