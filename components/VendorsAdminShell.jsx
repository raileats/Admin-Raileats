// components/VendorsAdminShell.jsx
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// import the existing client components from components folder
const VendorCsvUploader = dynamic(() => import("./VendorCsvUploader"), { ssr: false });
const VendorsList = dynamic(() => import("./VendorsList"), { ssr: false });

export default function VendorsAdminShell() {
  // when CSV is imported we bump refreshKey so VendorsList re-fetches
  const [refreshKey, setRefreshKey] = useState(0);

  function handleImportDone() {
    // bump key -> child VendorsList should watch this prop and re-fetch when changed
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Upload vendors CSV</h3>
        {/* pass a client handler to client uploader — allowed */}
        <VendorCsvUploader onDone={handleImportDone} />
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Vendors</h3>
        {/* pass refreshKey so VendorsList refetches when key changes */}
        <VendorsList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
