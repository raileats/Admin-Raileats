// app/admin/restros/[code]/edit/basic/page.tsx
import React from "react";
import BasicInfoClient from "@/components/tabs/BasicInfoClient";
import { getRestroById, Restro } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function BasicPage({ params }: Props) {
  const code = Number(params.code);
  if (Number.isNaN(code)) {
    return <div style={{ padding: 20 }}>Invalid code</div>;
  }

  let restro: Restro | null = null;

  try {
    restro = await getRestroById(code);
  } catch (err: any) {
    console.error("BasicPage getRestroById error:", err);
    return (
      <div style={{ padding: 20 }}>
        Error loading restro: {String(err?.message ?? err)}
      </div>
    );
  }

  if (!restro) {
    return <div style={{ padding: 20 }}>Restro not found</div>;
  }

  return <BasicInfoClient initialData={restro} />;
}
