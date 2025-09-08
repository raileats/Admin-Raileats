// app/admin/vendors/page.tsx  (server component)
import dynamic from "next/dynamic";

const VendorsAdminShell = dynamic(() => import("../../../components/VendorsAdminShell"), { ssr: false });

export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Outlets / Vendors</h1>
      <VendorsAdminShell />
    </div>
  );
}
