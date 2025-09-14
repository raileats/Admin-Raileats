import { db } from "@/lib/db";
  const { data, error } = await db.from("Stations").select("*").limit(1);
  return Response.json({ data, error });
}
