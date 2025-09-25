// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro } = await safeGetRestro(codeNum);

  // Fetch states
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const statesRes = await fetch(`${base}/api/states`, { cache: "no-store" });
  const statesJson = await statesRes.json().catch(() => null);
  const states = Array.isArray(statesJson?.states) ? statesJson.states : [];

  // Optionally fetch initial districts for restro's StateId so dropdown is prepopulated
  let initialDistricts: any[] = [];
  const stateId = restro?.StateId ?? null;
  if (stateId) {
    const districtsRes = await fetch(`${base}/api/districts?stateId=${stateId}`, { cache: "no-store" });
    const districtsJson = await districtsRes.json().catch(() => null);
    initialDistricts = Array.isArray(districtsJson?.districts) ? districtsJson.districts : [];
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
