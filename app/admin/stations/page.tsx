import dynamic from "next/dynamic";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

const StationsTable = dynamic(() => import("@/components/admin/StationsTable"), {
  ssr: false,
});

export default function StationsPage() {
  return (
    <AdminPage
      title="Stations"
      subtitle="Manage railway station master data"
    >
      <AdminCard bodyClassName="p-0">
        <StationsTable />
      </AdminCard>
    </AdminPage>
  );
}
