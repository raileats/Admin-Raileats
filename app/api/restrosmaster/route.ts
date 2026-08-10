import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const TABLE = "RestroMaster";

/* ---------------- UTILS ---------------- */
function sanitizeSearch(q: string) {
  return q.replace(/[%_']/g, "").trim();
}

function phone(value: any) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const digits = String(value).replace(/\D/g, "").slice(0, 10);
  return digits || null;
}

function normalizeRestroMasterPayload(body: any) {
  const normalized = { ...body };

  if (
    normalized.RestroPhone === undefined &&
    (normalized.restroPhone !== undefined ||
      normalized.RestroMobile !== undefined ||
      normalized.RestaurantPhone !== undefined ||
      normalized.Phone !== undefined)
  ) {
    normalized.RestroPhone =
      normalized.restroPhone ??
      normalized.RestroMobile ??
      normalized.RestaurantPhone ??
      normalized.Phone;
  }

  if (normalized.OwnerPhone !== undefined) {
    normalized.OwnerPhone = phone(normalized.OwnerPhone);
  }

  if (normalized.RestroPhone !== undefined) {
    normalized.RestroPhone = phone(normalized.RestroPhone);
  }

  return normalized;
}

function samePhone(saved: any, expected: any) {
  const clean = (value: any) => String(value ?? "").replace(/\D/g, "").slice(0, 10);
  return clean(saved) === clean(expected);
}

function normalizeCode(value: unknown) {
  const raw = String(value ?? "").trim();
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? String(numeric) : raw;
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const ACTIVE_ORDER_STATUSES = new Set([
  "booked",
  "verification",
  "inverification",
  "cancellationrequest",
  "neworder",
  "inkitchen",
  "outfordelivery",
  "restromarkdelivered",
  "restromarkeddelivered",
]);

function indiaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDeliveryAt(dateValue: unknown, timeValue: unknown) {
  const date = String(dateValue ?? "").trim();
  const time = String(timeValue ?? "00:00:00").trim();
  let year = 0;
  let month = 0;
  let day = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    [year, month, day] = date.split("-").map(Number);
  } else if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(date)) {
    [day, month, year] = date.split(/[-/]/).map(Number);
  } else {
    return null;
  }

  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  const timestamp = Date.UTC(year, month - 1, day, hour, minute, second) - 330 * 60 * 1000;
  return Number.isFinite(timestamp) ? timestamp : null;
}

/* ============================
   GET : LIST / SEARCH RESTROS
   Order: RestroCode DESC (BIGGEST ON TOP)
   ============================ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get("q") || "";
    const q = sanitizeSearch(qRaw);

    let query = supabaseServer
      .from(TABLE)
      .select("*")
      .order("RestroCode", { ascending: false }) // ✅ MAIN REQUIREMENT
      .limit(1000);

    if (q) {
      const pattern = `%${q}%`;
      query = query.or(
        [
          `RestroCode.ilike.${pattern}`,
          `RestroName.ilike.${pattern}`,
          `OwnerName.ilike.${pattern}`,
          `StationCode.ilike.${pattern}`,
          `StationName.ilike.${pattern}`,
        ].join(",")
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const restros = data ?? [];
    const restroCodes = restros
      .map((row: any) => Number(row.RestroCode))
      .filter((code: number) => Number.isFinite(code));

    if (!restroCodes.length) return NextResponse.json(restros);

    const now = Date.now();
    const windowStart = now - 60 * 60 * 1000;
    const windowEnd = now + 30 * 60 * 1000;
    const dateStart = indiaDateKey(new Date(windowStart));
    const dateEnd = indiaDateKey(new Date(windowEnd));

    const [fssaiResult, menuResult, orderResult] = await Promise.all([
      supabaseServer
        .from("RestroFSSAI")
        .select("RestroCode,fssai_number,expiry_date,status,created_at")
        .in("RestroCode", restroCodes)
        .order("created_at", { ascending: false }),
      supabaseServer
        .from("RestroMenuItems")
        .select("restro_code,menu_item_image")
        .in("restro_code", restroCodes)
        .eq("status", "ON"),
      supabaseServer
        .from("Orders")
        .select("RestroCode,Status,DeliveryDate,DeliveryTime")
        .in("RestroCode", restroCodes)
        .gte("DeliveryDate", dateStart)
        .lte("DeliveryDate", dateEnd),
    ]);

    if (fssaiResult.error) console.error("Restro list FSSAI summary error:", fssaiResult.error);
    if (menuResult.error) console.error("Restro list menu summary error:", menuResult.error);
    if (orderResult.error) console.error("Restro list order summary error:", orderResult.error);

    const latestFssai = new Map<string, any>();
    for (const row of fssaiResult.data ?? []) {
      const code = normalizeCode(row.RestroCode);
      if (code && !latestFssai.has(code)) latestFssai.set(code, row);
    }

    const activeMenuCounts = new Map<string, number>();
    const activeMenuImageCounts = new Map<string, number>();
    for (const row of menuResult.data ?? []) {
      const code = normalizeCode(row.restro_code);
      activeMenuCounts.set(code, (activeMenuCounts.get(code) ?? 0) + 1);
      const image = String(row.menu_item_image ?? "").trim().toLowerCase();
      if (image && image !== "null" && image !== "undefined" && image !== "-") {
        activeMenuImageCounts.set(code, (activeMenuImageCounts.get(code) ?? 0) + 1);
      }
    }

    const activeOrderCounts = new Map<string, number>();
    for (const row of orderResult.data ?? []) {
      if (!ACTIVE_ORDER_STATUSES.has(normalizeStatus(row.Status))) continue;
      const deliveryAt = parseDeliveryAt(row.DeliveryDate, row.DeliveryTime);
      if (deliveryAt === null || deliveryAt < windowStart || deliveryAt > windowEnd) continue;
      const code = normalizeCode(row.RestroCode);
      activeOrderCounts.set(code, (activeOrderCounts.get(code) ?? 0) + 1);
    }

    const enriched = restros.map((row: any) => {
      const code = normalizeCode(row.RestroCode);
      const fssai = latestFssai.get(code);
      return {
        ...row,
        FSSAINumber: fssai?.fssai_number ?? row.FSSAINumber ?? null,
        FSSAIExpiryDate: fssai?.expiry_date ?? row.FSSAIExpiryDate ?? null,
        FSSAIStatus: fssai?.status ?? row.FSSAIStatus ?? null,
        ActiveMenuCount: activeMenuCounts.get(code) ?? 0,
        ActiveMenuImageCount: activeMenuImageCounts.get(code) ?? 0,
        NearbyActiveOrderCount: activeOrderCounts.get(code) ?? 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("GET RestroMaster error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/* ============================
   PATCH : UPDATE RESTRO
   (Order NEVER changes on edit)
   ============================ */
export async function PATCH(req: Request) {
  try {
    const body = normalizeRestroMasterPayload(await req.json());
    const restroCode = body?.RestroCode;

    if (!restroCode) {
      return NextResponse.json(
        { error: "RestroCode is required for update" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "RestroName",
      "BrandNameifAny",
      "StationCode",
      "StationName",
      "State",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "RestroEmail",
      "RestroPhone",
      "RestroRating",
      "IsPureVeg",
      "RestroDisplayPhoto",
      "RaileatsStatus",
      "IsIrctcApproved",
      "FSSAINumber",
      "FSSAIExpiryDate",
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const { data, error } = await supabaseServer
      .from(TABLE)
      .update(updates)
      .eq("RestroCode", restroCode)
      .select("*")
      .limit(1);

    if (error) throw error;

    let row = data?.[0] ?? null;

    if (body.RestroPhone !== undefined && !samePhone(row?.RestroPhone, body.RestroPhone)) {
      const { data: retryData, error: retryError } = await supabaseServer
        .from(TABLE)
        .update({
          RestroPhone: body.RestroPhone,
          UpdatedAt: new Date().toISOString(),
        })
        .eq("RestroCode", restroCode)
        .select("*")
        .limit(1);

      if (retryError) throw retryError;

      row = retryData?.[0] ?? row;

      if (!samePhone(row?.RestroPhone, body.RestroPhone)) {
        return NextResponse.json(
          {
            ok: false,
            error: `RestroPhone save verify failed. Expected ${body.RestroPhone}, got ${row?.RestroPhone ?? "blank"}`,
            row,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, row });
  } catch (err: any) {
    console.error("PATCH RestroMaster error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/* ============================
   POST : ADD NEW RESTRO
   (Auto highest RestroCode)
   ============================ */
export async function POST(req: Request) {
  try {
    const body = normalizeRestroMasterPayload(await req.json());

    if (!body.RestroName || !body.StationCode || !body.StationName) {
      return NextResponse.json(
        { error: "RestroName, StationCode and StationName are required" },
        { status: 400 }
      );
    }

    // 🔥 Get highest RestroCode
    const { data: lastRows, error: lastErr } = await supabaseServer
      .from(TABLE)
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1);

    if (lastErr) throw lastErr;

    const lastCode = Number(lastRows?.[0]?.RestroCode ?? 1010);
    const newRestroCode = lastCode + 1;

    const insertPayload = {
      ...body,
      RestroCode: newRestroCode,
      RaileatsStatus: body.RaileatsStatus ?? 0,
    };

    const { data, error } = await supabaseServer
      .from(TABLE)
      .insert([insertPayload])
      .select()
      .limit(1);

    if (error) throw error;

    const row = data?.[0] ?? null;

return NextResponse.json(
  {
    ok: true,
    row,
    RestroCode: row?.RestroCode ?? newRestroCode,
  },
  { status: 201 }
);
} catch (err: any) {
  console.error("POST RestroMaster error:", err);

  return NextResponse.json(
    {
      ok: false,
      error: err?.message || String(err),
    },
    { status: 500 }
  );
}
}
