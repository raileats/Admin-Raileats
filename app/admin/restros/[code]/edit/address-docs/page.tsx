// server component
import React from "react";
import { safeGetRestro } from "@/lib/restroService";
import AddressDocsForm from "./AddressDocsForm";

type Props = { params: { code: string } };

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  if (error) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        <strong>Error loading restro:</strong> {String(error)}
      </div>
    );
  }

  if (!restro) {
    return (
      <div style={{ padding: 20, color: "#333" }}>
        Restro not found for code {params.code}
      </div>
    );
  }

  // pass restro to client form as initial props
  return (
    <div style={{ minHeight: 300 }}>
      <h2 style={{ textAlign: "center", color: "#333", marginTop: 8 }}>Address & Documents</h2>
      <AddressDocsForm initialData={restro} restroCode={codeNum} />
    </div>
  );
}
