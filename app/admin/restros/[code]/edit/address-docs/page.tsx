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
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Set them in Vercel.");
}

const supaServer = createClient(SUPA_URL, SUPA_SERVICE_KEY, { auth: { persistSession: false } });

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro } = await safeGetRestro(codeNum);

  // fetch states from DistrictMaster
  let states: { id: string; name: string }[] = [];
  try {
    const { data: srows } = await supaServer
      .from("DistrictMaster")
      .select('"StateName"')
      .neq('"StateName"', null)
      .order('"StateName"', { ascending: true });

    const unique = Array.from(new Set((srows || []).map((r: any) => (r["StateName"] ? String(r["StateName"]).trim() : "")))).filter(Boolean);
    states = unique.map((n) => ({ id: n, name: n }));
  } catch (e) {
    console.error("Failed to load states from DistrictMaster:", e);
    states = [];
  }

  // fetch initial districts for restro's state (if any)
  let initialDistricts: any[] = [];
  try {
    const restroState =
      (restro?.StateName ?? restro?.State ?? restro?.StateCode ?? restro?.["State Name"] ?? "") || "";

    if (restroState) {
      const { data: drows } = await supaServer
        .from("DistrictMaster")
        .select('"DistrictCode","DistrictName","StateCode","StateName"')
        .ilike('"StateName"', String(restroState));

      initialDistricts = (drows || []).map((r: any) => ({
        id: String(r["DistrictCode"] ?? r.DistrictCode ?? r.id ?? r["DistrictName"] ?? ""),
        name: String(r["DistrictName"] ?? r.DistrictName ?? r.name ?? ""),
        state_id: String(r["StateCode"] ?? r.StateCode ?? r["StateName"] ?? restroState),
      }));
    }
  } catch (e) {
    console.error("Failed to load initial districts from DistrictMaster:", e);
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
