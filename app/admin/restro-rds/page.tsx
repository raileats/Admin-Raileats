import dynamic from "next/dynamic";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
import AdminButton from "@/components/admin/AdminButton";

const RestroRdsTable = dynamic(() => import("@/components/admin/RestroRdsTable"), { ssr: false });

export default function RestroRdsPage() {
  return (
    <AdminPage title="Restro RDS" subtitle="Restaurant Running Due Statement">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link href="/admin/settlement-requests">
            <AdminButton>Settlement Requests</AdminButton>
          </Link>
        </div>
        <AdminCard bodyClassName="p-0">
          <RestroRdsTable />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
