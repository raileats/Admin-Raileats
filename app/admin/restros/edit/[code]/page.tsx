// app/admin/restros/edit/[code]/page.tsx
import React from "react";
import RestroEditPageClient from "@/components/RestroEditPageClient";
import { supabaseServer } from "@/lib/supabaseServer";

type Props = { params: { code: string } };

export default async function Page({ params }: Props) {
  const { code } = params;

  // try to fetch the restro by numeric RestroCode or string
  try {
    const numeric = Number(code);
    let q = supabaseServer.from("RestroMaster").select("*").limit(1);
    if (!Number.isNaN(numeric)) {
      q = (q as any).eq("RestroCode", numeric);
    } else {
      q = (q as any).eq("RestroCode", code);
    }
    const { data, error } = await q;
    if (error) {
      throw error;
    }
    const restro = (data && data[0]) ?? null;

    // Render client wrapper with initial data
    return (
      <div>
        <RestroEditPageClient restro={restro} />
      </div>
    );
  } catch (err: any) {
    // Show a minimal error UI server-side
    return (
      <div style={{ padding: 24 }}>
        <h1>Error loading restro</h1>
        <p style={{ color: "red" }}>Failed to fetch Restro {code}</p>
        <p>{String(err?.message ?? err)}</p>
      </div>
    );
  }
}
