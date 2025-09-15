// app/admin/restros/page.tsx
import dynamic from 'next/dynamic';
const RestroSidebar = dynamic(() => import('@/components/admin/RestroSidebar'), { ssr: false });

export default function RestrosPage() {
  return (
    <div>
      <h1 className="text-2xl mb-4">Restro Management</h1>
      <RestroSidebar />
    </div>
  );
}
