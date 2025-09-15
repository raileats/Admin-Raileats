// app/admin/stations/page.tsx
import dynamic from 'next/dynamic';
const StationsTable = dynamic(() => import('@/components/admin/StationsTable'), { ssr: false });

export default function StationsPage() {
  return (
    <div>
      <h1 className="text-2xl mb-4">Stations Management</h1>
      <StationsTable />
    </div>
  );
}
