// app/admin/restros/[code]/edit/address-docs/page.tsx
import React from "react";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function AddressDocsPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro } = await safeGetRestro(codeNum);

  return (
    <div>
      <AddressDocsClient
        initialData={restro}
        imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}
      />
    </div>
  );
}
