import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function parseActive(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const customerId = String(formData.get("customer_id") ?? "").trim();
    const active = parseActive(formData.get("active"));

    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "customer_id_required" },
        { status: 400 },
      );
    }

    const activeColumnCandidates = ["active", "Active", "is_active", "IsActive"];
    let lastError: any = null;
    let updated = false;

    for (const columnName of activeColumnCandidates) {
      const { error } = await serviceClient
        .from("customers")
        .update({ [columnName]: active })
        .eq("customer_id", customerId);

      if (!error) {
        updated = true;
        break;
      }

      lastError = error;
    }

    if (!updated) {
      console.error("ADMIN CUSTOMER STATUS UPDATE ERROR:", lastError);
      return NextResponse.json(
        {
          ok: false,
          error: "db_update_failed",
          details:
            "No supported active column found. Add active boolean column in customers table or rename the API column.",
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
