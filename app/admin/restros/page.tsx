import dynamic from 'next/dynamic';
const RestroMasterList = dynamic(()=>import('@/components/admin/RestroMasterList'), { ssr:false });

export default function RestroMasterPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Restro Master</h1>
      <RestroMasterList />
    </div>
  );
}
