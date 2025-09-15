import dynamic from 'next/dynamic';
const RestroList = dynamic(() => import('@/components/admin/RestroList'), { ssr: false });

export default function RestrosPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Restro Master</h1>
      <RestroList />
    </div>
  );
}
