// app/admin/payment-requests/page.tsx

import dynamic from "next/dynamic";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
import AdminButton from "@/components/admin/AdminButton";

const SettlementRequestsTable = dynamic(
  () => import("@/components/admin/SettlementRequestsTable"),
  { ssr: false }
);

export default function PaymentRequestsPage() {
  return (
    <AdminPage
      title="Payment Request"
      subtitle="Restaurant ne RailEats se payment request ki hai"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link href="/admin/deposited-update">
            <AdminButton>Restaurant Deposit Update</AdminButton>
          </Link>
        </div>

        <AdminCard bodyClassName="p-0">
          <SettlementRequestsTable />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
