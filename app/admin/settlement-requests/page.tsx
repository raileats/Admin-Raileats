import dynamic from "next/dynamic";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

const SettlementRequestsTable = dynamic(
  () => import("@/components/admin/SettlementRequestsTable"),
  { ssr: false }
);

export default function SettlementRequestsPage() {
  return (
    <AdminPage title="Settlement Requests" subtitle="Approve, reject and mark restaurant settlements paid">
      <AdminCard bodyClassName="p-0">
        <SettlementRequestsTable />
      </AdminCard>
    </AdminPage>
  );
}
