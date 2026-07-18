// app/admin/deposited-update/page.tsx

import dynamic from "next/dynamic";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
import AdminButton from "@/components/admin/AdminButton";

const PaymentRequestsTable = dynamic(
  () => import("@/components/admin/PaymentRequestsTable"),
  { ssr: false }
);

export default function DepositedUpdatePage() {
  return (
    <AdminPage
      title="Restaurant Deposit Update"
      subtitle="Restaurant ne RailEats ko kiye gaye payment ki details update ki hain"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link href="/admin/payment-requests">
            <AdminButton>Payment Request</AdminButton>
          </Link>
        </div>

        <AdminCard bodyClassName="p-0">
          <PaymentRequestsTable />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
