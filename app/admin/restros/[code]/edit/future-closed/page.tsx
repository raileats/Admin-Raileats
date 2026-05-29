// app/admin/restros/[code]/edit/future-closed/page.tsx
import FutureClosedTab from "@/components/restro-edit/FutureClosedTab";

export default function FutureClosedPage({ params }: { params: { code: string } }) {
  return <FutureClosedTab restroCode={params.code} />;
}
