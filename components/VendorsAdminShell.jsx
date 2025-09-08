// components/VendorsAdminShell.jsx
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// client components (relative imports inside components folder)
const VendorCsvUploader = dynamic(() => import("./VendorCsvUploader"), { ssr: false });
const VendorsList = dynamic(() => import("./VendorsList"), { ssr: false });

export default function VendorsAdminShell() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleImportDone() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Upload vendors CSV</h3>
        <VendorCsvUploader onDone={handleImportDone} />
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Vendors</h3>
        <VendorsList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
