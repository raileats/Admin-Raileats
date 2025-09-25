// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import { safeGetRestro } from "@/lib/restroService";

type Props = {
  params: { code: string };
};

// Server component page — mirrors pattern used by Basic Information and Station Settings
export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // If you handle not found differently in other tabs, keep that logic consistent.
  if (!restro) {
    return (
      <div style={{ padding: 18 }}>
        <h3 style={{ textAlign: "center", marginBottom: 18 }}>Address &amp; Documents</h3>
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 18 }}>
          <p>Restro not found.</p>
        </div>
      </div>
    );
  }

  // Pass NEXT_PUBLIC_IMAGE_PREFIX safely (server -> client)
  const imagePrefix = process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "";

  // Keep same wrapper classes/structure as Basic Information / Station Settings so layout matches.
  return (
    <div>
      {/* If your app wraps tabs in a specific class or container, keep the same wrapper here.
          The AddressDocsClient added earlier already centers the content to max-width:1100px. */}
      {/* Pass the server-fetched restro as initialData prop */}
      {/* Note: AddressDocsClient is a client component ('use client') so it's ok to pass plain data */}
      <AddressDocsClient initialData={restro} imagePrefix={imagePrefix} />
    </div>
  );
}
