// app/admin/restros/[code]/edit/bank/page.tsx
import BankTab from "@/components/restro-edit/BankTab";

export default function BankPage({ params }: { params: { code: string } }) {
  return <BankTab restroCode={params.code} />;
}
