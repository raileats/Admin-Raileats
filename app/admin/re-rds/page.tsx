// app/admin/re-rds/page.tsx

import dynamic from "next/dynamic";

import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

const ReRdsTable = dynamic(
  () =>
    import(
      "@/components/admin/ReRdsTable"
    ),
  {
    ssr: false,
  }
);

export default function ReRdsPage() {
  return (
    <AdminPage
      title="RE RDS"
      subtitle="RailEats Universal Running Due Statement"
    >
      <AdminCard bodyClassName="p-0">
        <ReRdsTable />
      </AdminCard>
    </AdminPage>
  );
}
