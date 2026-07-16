// app/admin/restros/[code]/statement/page.tsx

import Link from "next/link";

import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

import StatementClient from "@/components/restro-route-tabs/StatementClient";

type Props = {
  params: {
    code: string;
  };
};

export default function RestroStatementPage({
  params,
}: Props) {
  return (
    <AdminPage
      title="Restaurant Statement"
      subtitle="Restaurant monthly and custom date-range ledger statement"
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Link
            href={`/admin/restros/${encodeURIComponent(
              params.code
            )}/edit/settlement`}
          >
            <AdminButton variant="secondary">
              Back to Settlement
            </AdminButton>
          </Link>
        </div>

        <AdminCard bodyClassName="p-0">
          <StatementClient
            restroCode={params.code}
          />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
