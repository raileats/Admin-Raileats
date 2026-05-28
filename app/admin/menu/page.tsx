import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

export default function AdminMenu() {
  return (
    <AdminPage
      title="Menu"
      subtitle="Manage menu items and restaurant catalog records"
    >
      <AdminCard>
        <p className="text-sm font-medium text-slate-500">
          Manage menu items here.
        </p>
      </AdminCard>
    </AdminPage>
  );
}
