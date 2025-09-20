// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import { safeGetRestro } from "@/lib/restroService";
import AddressDocsForm from "@/components/AddressDocsForm";

type Props = { params: { code: string } };

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  if (error) {
    return (
      <div style={{ color: "red", padding: 20 }}>
        <strong>Error loading restro:</strong> {error}
      </div>
    );
  }

  if (!restro) {
    return (
      <div style={{ padding: 20, color: "#666" }}>
        Restro not found for code: {params.code}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Address & Documents</h3>
      <div style={{ maxWidth: 1200, margin: "8px auto 40px", padding: "0 6px" }}>
        {/* AddressDocsForm is a client component */}
        {/* Make sure components/AddressDocsForm.tsx exists */}
        <AddressDocsForm initialData={restro} />
      </div>
    </div>
  );
}
