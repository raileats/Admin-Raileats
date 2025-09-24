// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import { getRestroById, Restro } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function AddressDocsPage({ params }: Props) {
  const code = Number(params.code);
  if (Number.isNaN(code)) {
    return <div style={{ padding: 20 }}>Invalid code</div>;
  }

  let restro: Restro | null = null;
  try {
    restro = await getRestroById(code);
  } catch (err: any) {
    console.error("AddressDocsPage getRestroById error:", err);
    return <div style={{ padding: 20 }}>Error loading restro: {String(err?.message ?? err)}</div>;
  }

  if (!restro) {
    return <div style={{ padding: 20 }}>Restro not found</div>;
  }

  return <AddressDocsClient initialData={restro} />;
}
