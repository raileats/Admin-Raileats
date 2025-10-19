// app/admin/stations/page.tsx
import dynamic from "next/dynamic";
const StationsTable = dynamic(() => import("@/components/admin/StationsTable"), { ssr: false });

export default function StationsPage() {
  return (
    <div className="mx-6 my-4 max-w-full">
      {/* Removed the outer heading to avoid duplication */}
      <StationsTable />
    </div>
  );
}
