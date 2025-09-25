// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

function pickField(obj: any, candidates: string[]) {
  if (!obj || typeof obj !== "object") return null;
  const keys = Object.keys(obj);
  for (const c of candidates) {
    // exact match (case-sensitive)
    if (keys.includes(c)) return c;
  }
  // case-insensitive match
  for (const c of candidates) {
    const found = keys.find((k) => k.toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  // try plural/singular heuristics
  for (const k of keys) {
    const kl = k.toLowerCase();
    for (const c of candidates) {
      const cl = c.toLowerCase();
      if (kl === cl || kl.includes(cl) || cl.includes(kl)) return k;
    }
  }
  return null;
}

async function tryFetchTable(sb: any, table: string, stateId: string | null) {
  // Build a base query selecting all columns so we can detect columns
  let q = sb.from(table).select("*").limit(1000).order("id", { ascending: true });

  // If stateId provided, attempt common column filters (safe: we'll ignore errors and fallback)
  if (stateId) {
    // We'll attempt eq on common state columns by testing which exists.
    const candidates = ["StateCode", "statecode", "state_code", "State", "state", "state_id"];
    // Try to call select for each candidate to see if column exists (small read)
    for (const cand of candidates) {
      try {
        const probe = await sb.from(table).select(cand).limit(1);
        if (!probe.error && Array.isArray(probe.data)) {
          // use that column in the actual query
          try {
            const q2 = sb.from(table).select("*").eq(cand, stateId).order("id", { ascending: true }).limit(1000);
            const res = await q2;
            return res;
          } catch (e) {
            // ignore, continue to next candidate
          }
        }
      } catch (e) {
        // ignore probe error
      }
    }
    // fallback: try or() on multiple possible columns (if Supabase supports OR on these columns)
    try {
      const orExpr = candidates.map((c) => `${c}.eq.${stateId}`).join(",");
      const res = await sb.from(table).select("*").or(orExpr).order("id", { ascending: true }).limit(1000);
      return res;
    } catch (e) {
      // ignore
    }
  }

  // if no state filter or fallback
  try {
    const res = await q;
    return res;
  } catch (e) {
    return { data: null, error: e as any };
  }
}

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const stateId = url.searchParams.get("stateId") ?? null;

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Try multiple reasonable table names (most likely one will exist)
    const tableCandidates = ["DistrictMaster", "Districts", "districtmaster", "districts"];
    let rows: any[] | null = null;
    let lastErr: any = null;

    for (const t of tableCandidates) {
      try {
        const res = await tryFetchTable(sb, t, stateId);
        if (res && !res.error && Array.isArray(res.data)) {
          rows = res.data;
          break;
        } else {
          lastErr = res?.error ?? lastErr;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!rows) {
      // nothing found; return empty array (but inform)
      console.warn("No rows fetched for Districts. Last error:", lastErr);
      return NextResponse.json({ ok: true, districts: [] });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: true, districts: [] });
    }

    // Detect fields from sample row
    const sample = rows[0];

    // Possible names for code, name, state columns (in decreasing priority)
    const codeCandidates = ["DistrictCode", "districtcode", "district_id", "id", "District", "Districts", "district"];
    const nameCandidates = ["DistrictName", "districtname", "name", "district", "Districts", "District"];
    const stateCandidates = ["StateCode", "statecode", "state_code", "State", "state", "state_id"];

    const codeField = pickField(sample, codeCandidates) ?? "id";
    const nameField = pickField(sample, nameCandidates) ?? "name";
    const stateField = pickField(sample, stateCandidates) ?? null;

    const districts = (rows as any[]).map((r) => {
      const idVal = r[codeField] ?? r.id ?? r.DistrictCode ?? r.districtcode ?? "";
      const nameVal = r[nameField] ?? r.name ?? r.DistrictName ?? r.districtname ?? "";
      const stateVal = stateField ? r[stateField] ?? r.StateCode ?? r.statecode ?? "" : "";

      return {
        id: idVal !== null && idVal !== undefined ? String(idVal) : "",
        name: nameVal !== null && nameVal !== undefined ? String(nameVal) : "",
        state_id: stateVal !== null && stateVal !== undefined ? String(stateVal) : "",
      };
    });

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
