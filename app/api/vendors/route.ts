// app/api/vendors/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const alpha = url.searchParams.get("alpha") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

  try {
    let query = supabase
      .from("vendors")
      .select("*", { count: "exact" })
      .order("outlet_name", { ascending: true });

    if (q) {
      // basic OR search: outlet_id, outlet_name, owner_mobile
      query = query.or(
        `outlet_id.ilike.%${q}%,outlet_name.ilike.%${q}%,owner_mobile.ilike.%${q}%`
      );
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (alpha) {
      query = query.ilike("outlet_name", `${alpha}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return NextResponse.json({ data, count, page, pageSize });
  } catch (err: any) {
    console.error("Vendors GET error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
