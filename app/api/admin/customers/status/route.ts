import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function normalizeStatus(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().toLowerCase();
  return text === "active" ? "Active" : "Inactive";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const customerId = String(formData.get("customer_id") ?? "").trim();
    const userTypeAgent = normalizeStatus(formData.get("user_type_agent"));

    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "customer_id_required" },
        { status: 400 },
      );
    }

    const { error } = await serviceClient
      .from("customers")
      .update({ user_type_agent: userTypeAgent })
      .eq("customer_id", customerId);

    if (error) {
      console.error("ADMIN CUSTOMER STATUS UPDATE ERROR:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "db_update_failed",
          details: error.message,
        },
        { status: 500 },
      );
    }

    const referer = request.headers.get("referer") || "/admin/customers";
    return NextResponse.redirect(referer, { status: 303 });
  } catch (error) {
    console.error("ADMIN CUSTOMER STATUS API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
