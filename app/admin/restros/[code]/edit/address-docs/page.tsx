// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import { safeGetRestro } from "@/lib/restroService";
import { createClient } from "@supabase/supabase-js";

type Props = { params: { code: string } };

// Server-side Supabase client using service role key (must be set in Vercel env)
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

  // --- Fetch distinct states from DistrictsMaster server-side ---
  let states: { id: string; name: string }[] = [];
  try {
    const { data: statesRows } = await supaServer
      .from("DistrictsMaster")
      .select('"State Name"')
      .neq('"State Name"', null)
      .order('"State Name"', { ascending: true });

    const unique = Array.from(
      new Set(
        (statesRows || []).map((r: any) =>
          r["State Name"] ? String(r["State Name"]).trim() : ""
        )
      )
    ).filter(Boolean);

    states = unique.map((name) => ({ id: name, name }));
  } catch (e) {
    console.error("Failed to load states from DistrictsMaster:", e);
    states = [];
  }

  // --- Fetch initial districts for the restro's state (if available) ---
  let initialDistricts: any[] = [];
  try {
    const restroState =
      (restro?.["State Name"] ??
        restro?.State ??
        restro?.StateName ??
        restro?.StateCode ??
        "") || "";

    if (restroState) {
      const { data: drows } = await supaServer
        .from("DistrictsMaster")
        .select('"District Code","District Name","State Code","State Name"')
        .ilike('"State Name"', String(restroState));

      initialDistricts = (drows || []).map((r: any) => ({
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
