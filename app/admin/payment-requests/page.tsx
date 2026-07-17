// app/admin/payment-requests/page.tsx

import dynamic from "next/dynamic";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

const PaymentRequestsTable = dynamic(
  () => import("@/components/admin/PaymentRequestsTable"),
  { ssr: false }
);

export default function PaymentRequestsPage() {
  return (
    <AdminPage
      title="Restaurant Payment Requests"
      subtitle="Verify payment proof and mark received"
    >
      <AdminCard bodyClassName="p-0">
        <PaymentRequestsTable />
      </AdminCard>
    </AdminPage>
  );
}
