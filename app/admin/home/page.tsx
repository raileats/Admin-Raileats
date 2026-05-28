import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";

const stats = [
  {
    label: "Orders",
    value: "12",
    helper: "Pending orders",
  },
  {
    label: "Active Outlets",
    value: "34",
    helper: "Restaurants currently enabled",
  },
  {
    label: "Menu Items",
    value: "128",
    helper: "Published menu records",
  },
];

export default function AdminHome() {
  return (
    <AdminPage
      title="Dashboard"
      subtitle="Welcome to the RailEats admin dashboard"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <AdminCard key={item.label}>
            <div className="text-sm font-semibold text-slate-500">{item.label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-950">{item.value}</div>
            <div className="mt-1 text-sm text-slate-500">{item.helper}</div>
          </AdminCard>
        ))}
      </div>
    </AdminPage>
  );
}
