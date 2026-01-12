import React from "react";
import BasicInfoClient from "@/components/tabs/BasicInfoClient";
import { getRestroById } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function BasicPage({ params }: Props) {
  const code = Number(params.code);

  if (Number.isNaN(code)) {
    return <div style={{ padding: 20 }}>Invalid Restro Code</div>;
  }

  const restro = await getRestroById(code);

  if (!restro) {
    return <div style={{ padding: 20 }}>Restro not found</div>;
  }

  return (
    <BasicInfoClient
      initialData={restro}
      imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}
    />
  );
}
