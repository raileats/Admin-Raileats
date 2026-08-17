import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* 🔥 SUPABASE CLIENT (SERVICE ROLE REQUIRED) */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ========================= DATE STATUS HELPERS ========================= */
function parseDateOnly(value: any): Date | null {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  // yyyy-mm-dd OR yyyy-mm-ddTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [y, m, d] = text.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [d, m, y] = text.split("/").map(Number);
    return new Date(y, m - 1, d);
  }

  const dt = new Date(text);
  if (Number.isNaN(dt.getTime())) return null;

  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function getFssaiStatus(expiryDate: any): "active" | "inactive" {
  const expiry = parseDateOnly(expiryDate);

  if (!expiry) return "inactive";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  expiry.setHours(0, 0, 0, 0);

  return expiry >= today ? "active" : "inactive";
}

async function syncFssaiStatuses(restroCode: number, rows: any[]) {
  if (!rows.length) return { latestStatus: "inactive" as const };

  const latest = rows[0];
  const latestStatus = getFssaiStatus(latest.expiry_date);

  // Only the newest FSSAI can be active. This intentionally does not filter
  // by the old status value, because legacy rows may contain "Active" casing.
  const { error: deactivateError } = await supabase
    .from("RestroFSSAI")
    .update({ status: "inactive" })
    .eq("RestroCode", restroCode);

  if (deactivateError) throw new Error(deactivateError.message);

  if (latestStatus === "active") {
    let activateQuery = supabase
      .from("RestroFSSAI")
      .update({ status: "active" })
      .eq("RestroCode", restroCode);

    if (latest.id != null) {
      activateQuery = activateQuery.eq("id", latest.id);
    } else if (latest.FssaiId != null) {
      activateQuery = activateQuery.eq("FssaiId", latest.FssaiId);
    } else if (latest.created_at) {
      activateQuery = activateQuery.eq("created_at", latest.created_at);
    } else {
      activateQuery = activateQuery
        .eq("fssai_number", latest.fssai_number)
        .eq("expiry_date", latest.expiry_date);
    }

    const { error: activateError } = await activateQuery;
    if (activateError) throw new Error(activateError.message);
  }

  const { error: masterError } = await supabase
    .from("RestroMaster")
    .update({
      FSSAINumber: latest.fssai_number,
      FSSAIExpiryDate: latest.expiry_date,
      FSSAICopyUpload: latest.file_url ?? null,
      FSSAIStatus: latestStatus === "active" ? "Active" : "Inactive",
      UpdatedAt: new Date().toISOString(),
    })
    .eq("RestroCode", restroCode);

  if (masterError) throw new Error(masterError.message);

  return { latestStatus };
}

/* ========================= GET ========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = Number(params.code);

  if (!restroCode || Number.isNaN(restroCode)) {
    return NextResponse.json({
      ok: false,
      error: "Invalid RestroCode",
    });
  }

  const { data, error } = await supabase
    .from("RestroFSSAI")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  try {
    await syncFssaiStatuses(restroCode, data || []);
  } catch (syncError: any) {
    return NextResponse.json({
      ok: false,
      error: syncError?.message || "FSSAI status sync failed",
    });
  }

  const rows = (data || []).map((r: any, idx: number) => {
    const computedStatus =
      idx === 0 ? getFssaiStatus(r.expiry_date) : "inactive";

    return {
      id: r.id ?? r.FssaiId ?? `${r.RestroCode}-${r.fssai_number}-${idx}`,
      fssai_number: r.fssai_number,
      expiry_date: r.expiry_date,
      file_url: r.file_url ?? null,
      status: computedStatus,
      created_at: r.created_at ?? r.CreatedDate ?? null,
    };
  });

  return NextResponse.json(
    { ok: true, rows },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

/* ========================= POST ========================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = Number(params.code);

  if (!restroCode || Number.isNaN(restroCode)) {
    return NextResponse.json({
      ok: false,
      error: "Invalid RestroCode",
    });
  }

  const form = await req.formData();

  const fssai_number = form.get("fssai_number") as string;
  const expiry_date = (form.get("expiry_date") as string | null) || null;
  const file = form.get("file") as File | null;

  if (!fssai_number) {
    return NextResponse.json({
      ok: false,
      error: "FSSAI number is required",
    });
  }

  const newStatus = getFssaiStatus(expiry_date);

  /* 🔥 STEP 1: FILE UPLOAD */
  let file_url: string | null = null;

  if (file) {
    const ext = file.name.split(".").pop();
    const path = `${restroCode}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("fssai-docs")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json({
        ok: false,
        error: uploadError.message,
      });
    }

    const { data } = supabase.storage
      .from("fssai-docs")
      .getPublicUrl(path);

    file_url = data.publicUrl;
  }

  /* 🔥 STEP 2: INSERT NEW FSSAI */
  const { data: row, error } = await supabase
    .from("RestroFSSAI")
    .insert({
      RestroCode: restroCode,
      fssai_number,
      expiry_date,
      file_url,
      status: newStatus,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
    });
  }

  /* 🔥 STEP 3: NEWEST/UNEXPIRED ONLY → ACTIVE */
  const { data: allRows, error: rowsError } = await supabase
    .from("RestroFSSAI")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("created_at", { ascending: false });

  if (rowsError) {
    return NextResponse.json({
      ok: false,
      error: rowsError.message,
    });
  }

  try {
    await syncFssaiStatuses(restroCode, allRows || []);
  } catch (syncError: any) {
    return NextResponse.json({
      ok: false,
      error: syncError?.message || "FSSAI status sync failed",
    });
  }

  return NextResponse.json(
    { ok: true, row: { ...row, status: newStatus } },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
