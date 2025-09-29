// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import { safeGetRestro } from "@/lib/restroService";
import AddressDocsForm from "./AddressDocsForm";

type Props = { params: { code: string } };

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  return (
    <div style={{ minHeight: 300, padding: 10 }}>
      <h2 style={{ textAlign: "center", color: "#333", marginTop: 8 }}>Address & Documents</h2>

      {error && (
        <div style={{ color: "red", padding: 12 }}>
          <strong>Error loading restro:</strong> {error}
        </div>
      )}

      {!error && !restro && (
        <div style={{ color: "#333", padding: 12 }}>
          <div style={{ color: "red", marginBottom: 8 }}>Error: Not found</div>
          <div>Restro not found</div>
        </div>
      )}

      {!error && restro && (
        <div>
          {/* pass restro as initialData to the client form */}
          {/* AddressDocsForm is a client component so we import the file above */}
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <AddressDocsForm initialData={restro} restroCode={codeNum} />
        </div>
      )}
    </div>
  );
}
