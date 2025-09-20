// TEMP TEST: app/admin/restros/[code]/edit/basic/page.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function BasicEditPage({ params }: Props) {
  const codeNum = Number(params.code);

  try {
    const { restro, error } = await safeGetRestro(codeNum);

    return (
      <div style={{ padding: 24 }}>
        <h2>Server test - Restro data</h2>
        <div>
          <strong>code:</strong> {params.code}
        </div>
        <div style={{ marginTop: 12 }}>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({ restro, error }, null, 2)}</pre>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/restros">Back</Link>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ color: "red" }}>Server exception (caught)</h3>
        <pre>{String(err?.message ?? err)}</pre>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/restros">Back</Link>
        </div>
      </div>
    );
  }
}
