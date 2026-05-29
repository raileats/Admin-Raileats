import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
import MenuItemsTable from "@/components/admin/MenuItemsTable";

export default function AdminMenu() {
  return (
    <AdminPage
      title="Menu"
      subtitle="Manage menu items and restaurant catalog records"
    >
      <AdminCard title="Menu Items">
        <MenuItemsTable />
      </AdminCard>
    </AdminPage>
  );
}
