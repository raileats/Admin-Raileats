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
      subtitle="Restaurant Monthly / Date Range Statement"
    >
      <AdminCard bodyClassName="p-0">
        <StatementClient
          restroCode={params.code}
        />
      </AdminCard>
    </AdminPage>
  );
}
