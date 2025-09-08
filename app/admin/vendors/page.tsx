// app/admin/vendors/page.tsx
import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// These are client components — dynamic import not required but safe to keep for SSR parity.
// Adjust paths if you placed components elsewhere.
const VendorCsvUploader = dynamic(() => import("../../../components/VendorCsvUploader"), { ssr: false });
const VendorsList = dynamic(() => import("../../../components/VendorsList"), { ssr: false });

export const metadata = {
  title: "Admin • Vendors",
};

export default function AdminVendorsPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors / Outlets</h1>
          <p className="text-sm text-slate-500">Upload vendor CSV, view & manage outlets.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="px-3 py-2 border rounded">Back</Link>
        </div>
      </div>

      {/* CSV uploader: place it at top so admin can import */}
      <section className="bg-white dark:bg-[#071827] p-4 rounded shadow-card">
        <h3 className="font-medium mb-2">Import vendors (CSV)</h3>
        <p className="text-sm text-slate-500 mb-3">Upload the Restro Master CSV. The importer validates and upserts rows (outlet_id).</p>
        <VendorCsvUploader onDone={() => { /* optional callback: refresh list via event or page refresh */ }} />
      </section>

      {/* Vendors list */}
      <section className="bg-white dark:bg-[#071827] p-4 rounded shadow-card">
        <h3 className="font-medium mb-2">Vendors list</h3>
        <VendorsList />
      </section>
    </div>
  );
}
