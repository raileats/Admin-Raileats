// components/VendorCsvUploader.jsx
"use client";
import React, { useState } from "react";
import Papa from "papaparse";

export default function VendorCsvUploader({ onDone }) {
  const [preview, setPreview] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);

  function normalizePhone(v){
    if(v==null) return "";
    const s = String(v).replace(/\D/g,'');
    if(s.length===12 && s.startsWith('91')) return s.slice(-10);
    return s;
  }

  function mapRow(r){
    return {
      outlet_id: (r["Restro Code"] ?? "").toString().trim(),
      outlet_name: (r["Restro Name"] ?? "").toString().trim(),
      station_code: (r["Station Code"] ?? "").toString().trim(),
      station_name: (r["Station Name"] ?? "").toString().trim(),
      owner_name: (r["Owner Name"] ?? "").toString().trim(),
      owner_mobile: normalizePhone(r["Owner Phone"] ?? r["Restro Phone"] ?? ""),
      outlet_phone: normalizePhone(r["Restro Phone"] ?? ""),
      fssai_no: (r["FSSAI Number"] ?? r["FSSAI"] ?? "")?.toString().trim(),
      gst_no: (r["GST Number"] ?? r["GST"] ?? "")?.toString().trim(),
      pan_no: (r["PAN Number"] ?? r["PAN"] ?? "")?.toString().trim(),
      latitude: r["latitude"] ? parseFloat(r["latitude"]) : null,
      longitude: r["longitude"] ? parseFloat(r["longitude"]) : null,
      min_order_value: r["Min Order Value"] ? parseFloat(r["Min Order Value"]) : 0,
      delivery_charges: r["Delivery Charges"] ? parseFloat(r["Delivery Charges"]) : 0,
      start_time: (r["AM Time"] ?? r["Start Time"] ?? "")?.toString().trim(),
      end_time: (r["PM Time"] ?? r["End Time"] ?? "")?.toString().trim(),
      status: (r["Raileats Status"] == 1 || r["Raileats Status"] === "1") ? "active" : "inactive",
      raw: r // keep raw for debugging
    };
  }

  function validate(mapped){
    const errs = [];
    if(!mapped.outlet_id) errs.push("Missing Restro Code");
    if(!mapped.outlet_name) errs.push("Missing Restro Name");
    if(!mapped.station_code) errs.push("Missing Station Code");
    if(!mapped.owner_mobile || mapped.owner_mobile.length < 10) errs.push("Invalid Owner Phone");
    return errs;
  }

  function handleFile(e){
    const file = e.target.files?.[0];
    if(!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results){
        const rows = results.data;
        const mappedAll = rows.map(mapRow);
        const invalid = [];
        const valid = [];
        mappedAll.forEach((m, idx) => {
          const errs = validate(m);
          if(errs.length) invalid.push({ row: idx+2, errors: errs, raw: m.raw });
          else valid.push(m);
        });
        setPreview(mappedAll.slice(0,30)); // show some preview
        setInvalidRows(invalid);
        if(invalid.length>0){
          alert("Found " + invalid.length + " invalid rows. Check preview below.");
        } else {
          if(confirm("No validation errors. Import " + valid.length + " rows now?")) {
            startImport(valid);
          }
        }
      },
      error(err){ alert("CSV parse error: " + err.message); }
    });
  }

  async function startImport(validRows){
    setImporting(true);
    const batchSize = 200;
    for(let i=0;i<validRows.length;i+=batchSize){
      const batch = validRows.slice(i, i+batchSize);
      const res = await fetch("/api/vendors/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendors: batch })
      });
      if(!res.ok){
        const text = await res.text();
        alert("Import failed: " + text);
        setImporting(false);
        return;
      }
      setProgress(Math.round(((i+batch.length)/validRows.length)*100));
    }
    setImporting(false);
    setProgress(100);
    alert("Import complete");
    onDone && onDone();
  }

  return (
    <div className="space-y-3">
      <input type="file" accept=".csv" onChange={handleFile} />
      { preview.length>0 && (
        <div>
          <h4 className="font-medium">Preview (first rows)</h4>
          <pre className="text-xs max-h-48 overflow-auto bg-slate-50 p-2 rounded">{JSON.stringify(preview.slice(0,10), null, 2)}</pre>
        </div>
      )}
      { invalidRows.length>0 && (
        <div className="text-red-600">
          Found {invalidRows.length} invalid rows (showing up to 50). Fix CSV or ask to import valid rows only.
          <pre className="text-xs max-h-48 overflow-auto bg-[#fff1f0] p-2 rounded">{JSON.stringify(invalidRows.slice(0,50), null, 2)}</pre>
        </div>
      )}
      { importing && <div>Importing... {progress}%</div> }
    </div>
  );
}
