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
  throw new Error("Missing Supabase env vars (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
}

const supaServer = createClient(SUPA_URL, SUPA_SERVICE_KEY, { auth: { persistSession: false } });

// candidate table names to try
const DISTRICT_TABLES = [
  "District_Masters",
  "district_masters",
  "DistrictMaster",
  "district_master",
  "DistrictsMaster",
  "districts_master",
  "District_Master",
  "districts",
];

async function detectDistrictTable() {
  for (const t of DISTRICT_TABLES) {
    try {
      const { error } = await supaServer.from(t).select("1").limit(1);
      if (!error) {
        console.error("[DBG] page.tsx using table:", t);
        return t;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro } = await safeGetRestro(codeNum);

  // detect which table exists
  const table = await detectDistrictTable();

  // --- Fetch distinct states ---
  let states: { id: string; name: string }[] = [];
  try {
    if (table) {
      const { data } = await supaServer
        .from(table)
        .select('"State Name"')
        .neq('"State Name"', null)
        .order('"State Name"', { ascending: true })
        .limit(2000);

      const unique = Array.from(
        new Set((data || []).map((r: any) => (r["State Name"] ? String(r["State Name"]).trim() : "")))
      ).filter(Boolean);

      states = unique.map((s) => ({ id: s, name: s }));
    }
  } catch (e) {
    console.error("Failed to load states:", e);
  }

  // --- Fetch initial districts for restro's state ---
  let initialDistricts: any[] = [];
  try {
    const restroState =
      (restro?.["State Name"] ?? restro?.State ?? restro?.StateName ?? restro?.StateCode ?? "") || "";

    if (table && restroState) {
      const { data } = await supaServer
        .from(table)
        .select('"District Code","District Name","State Code","State Name"')
        .ilike('"State Name"', String(restroState));

      initialDistricts = (data || []).map((r: any) => ({
        id: String(r["District Code"] ?? r.DistrictCode ?? r.id ?? r["District Name"] ?? ""),
        name: String(r["District Name"] ?? r.DistrictName ?? r.name ?? ""),
        state_id: String(r["State Code"] ?? r.StateCode ?? r["State Name"] ?? restroState),
      }));
    }
  } catch (e) {
    console.error("Failed to load initial districts:", e);
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
