// app/admin/restros/[code]/accounting/page.tsx

import Link from "next/link";

import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

import AccountingDashboardClient from "@/components/restro-route-tabs/AccountingDashboardClient";

type Props = {
  params: {
    code: string;
  };
};

export default function RestroAccountingPage({
  params,
}: Props) {
  return (
    <AdminPage
      title="Restaurant Accounting"
      subtitle="Restaurant finance dashboard and quick actions"
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Link
            href={`/admin/restros/${encodeURIComponent(
              params.code
            )}/edit/basic`}
          >
            <AdminButton variant="secondary">
              Back to Restaurant
            </AdminButton>
          </Link>
        </div>

        <AdminCard bodyClassName="p-0">
          <AccountingDashboardClient
            restroCode={
              params.code
            }
          />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
