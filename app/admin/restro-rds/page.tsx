import dynamic from "next/dynamic";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

const RestroRdsTable = dynamic(
  () => import("@/components/admin/RestroRdsTable"),
  {
    ssr: false,
  }
);

export default function RestroRdsPage() {
  return (
    <AdminPage
      title="Restro RDS"
      subtitle="Restaurant Running Due Statement"
    >
      <AdminCard bodyClassName="p-0">
        <RestroRdsTable />
      </AdminCard>
    </AdminPage>
  );
}
