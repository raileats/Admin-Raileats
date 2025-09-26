// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import { safeGetRestro } from "@/lib/restroService";
import { createClient } from "@supabase/supabase-js";

type Props = { params: { code: string } };

const SUPA_URL = process.env.SUPABASE_URL!;
const SUPA_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!;

if (!SUPA_URL || !SUPA_SERVICE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Set them in Vercel."
  );
}

const supaServer = createClient(SUPA_URL, SUPA_SERVICE_KEY, {
  auth: { persistSession: false },
});

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro } = await safeGetRestro(codeNum);

  // --- Fetch distinct states from District_Masters server-side ---
  let states: { id: string; name: string }[] = [];
  let statesRowsRaw: any[] = [];
  try {
    // NOTE: using table name `District_Masters` (as you confirmed)
    const { data: statesRows } = await supaServer
      .from("District_Masters")
      .select('"State Name"')
      .neq('"State Name"', null)
      .order('"State Name"', { ascending: true });

    statesRowsRaw = statesRows || [];
    const unique = Array.from(
      new Set(statesRowsRaw.map((r: any) => (r["State Name"] ? String(r["State Name"]).trim() : "")))
    ).filter(Boolean);

    states = unique.map((name) => ({ id: name, name }));
    console.error("[DBG] loaded statesRows count:", statesRowsRaw.length, "unique states:", states.length);
    if (statesRowsRaw.length > 0) console.error("[DBG] sample statesRows[0]:", statesRowsRaw[0]);
  } catch (e) {
    console.error("Failed to load states from District_Masters:", e);
    states = [];
  }

  // fallback: try server-side internal API if states empty (helps detect other mismatches)
  if (!states.length) {
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
      if (base) {
        const statesRes = await fetch(`${base}/api/states`, { cache: "no-store" });
        const sj = await statesRes.json().catch(() => null);
        if (Array.isArray(sj?.states) && sj.states.length) {
          states = sj.states;
          console.error("[DBG] fallback /api/states returned", sj.states.length);
        } else {
          console.error("[DBG] fallback /api/states returned empty or invalid shape", sj);
        }
      } else {
        console.error("[DBG] no base url for fallback /api/states");
      }
    } catch (e) {
      console.error("[DBG] fallback /api/states error:", e);
    }
  }

  // --- Fetch initial districts for the restro's state (if available) ---
  let initialDistricts: any[] = [];
  let drowsRaw: any[] = [];
  try {
    const restroState =
      (restro?.["State Name"] ??
        restro?.State ??
        restro?.StateName ??
        restro?.StateCode ??
        "") || "";

    console.error(
      "[DBG] restroState derived as:",
      restroState,
      "restro row sample:",
      restro && { RestroCode: restro.RestroCode, State: restro.State, StateName: restro.StateName, Districts: restro.Districts }
    );

    if (restroState) {
      const { data: drows } = await supaServer
        .from("District_Masters")
        .select('"District Code","District Name","State Code","State Name"')
        .ilike('"State Name"', String(restroState));

      drowsRaw = drows || [];
      initialDistricts = drowsRaw.map((r: any) => ({
        id: String(
          r["District Code"] ??
            r["DistrictCode"] ??
            r.id ??
            r["District Name"]
        ),
        name: String(
          r["District Name"] ?? r["DistrictName"] ?? r.name ?? ""
        ),
        state_id: String(
          r["State Code"] ??
            r["StateCode"] ??
            r["State Name"] ??
            restroState
        ),
      }));

      console.error("[DBG] loaded initialDistricts count:", initialDistricts.length);
      if (drowsRaw.length > 0) console.error("[DBG] sample drowsRaw[0]:", drowsRaw[0]);
    } else {
      console.error("[DBG] restroState empty — cannot load initialDistricts");
    }
  } catch (e) {
    console.error("Failed to load initial districts:", e);
    initialDistricts = [];
  }

  return (
    <div>
      <AddressDocsClient
        initialData={restro}
        imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}
        states={states}
        initialDistricts={initialDistricts}
      />
    </div>
  );
}
