// app/admin/settlement-requests/page.tsx

import dynamic from "next/dynamic";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
import AdminButton from "@/components/admin/AdminButton";

const SettlementRequestsTable = dynamic(
  () => import("@/components/admin/SettlementRequestsTable"),
  { ssr: false }
);

export default function SettlementRequestsPage() {
  return (
    <AdminPage
      title="Settlement Requests"
      subtitle="Approve, reject and mark restaurant settlements paid"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link href="/admin/payment-requests">
            <AdminButton>
              Incoming Payment Requests
            </AdminButton>
          </Link>
        </div>

        <AdminCard bodyClassName="p-0">
          <SettlementRequestsTable />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
