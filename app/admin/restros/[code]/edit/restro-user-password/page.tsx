// app/admin/restros/[code]/edit/restro-user-password/page.tsx
import RestroUserPasswordClient from "@/components/restro-route-tabs/RestroUserPasswordClient";
import { getRestroById } from "@/lib/restroService";

export default async function RestroUserPasswordPage({ params }: { params: { code: string } }) {
  const code = Number(params.code);
  if (Number.isNaN(code)) return <div className="p-5">Invalid Restro Code</div>;
  const restro = await getRestroById(code);
  if (!restro) return <div className="p-5">Restro not found</div>;
  return <RestroUserPasswordClient initialData={restro} restroCode={code} />;
}
