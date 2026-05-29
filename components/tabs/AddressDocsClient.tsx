"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminTextarea } from "@/components/admin/AdminField";

type Props = {
  initialData?: any;
  imagePrefix?: string;
  restroCode?: string | number;
};

type FssaiRow = {
  id: string | number;
  fssai_number: string;
  expiry_date: string | null;
  file_url: string | null;
  status: "active" | "inactive";
  created_at: string | null;
};

type GstRow = {
  id: string | number;
  GstNumber: string;
  GstType: string | null;
  fileurl: string | null;
  Gststatus: "Active" | "Inactive";
  createdDate: string | null;
};

type PanRow = {
  id: string | number;
  pan_number: string;
  pan_type: string | null;
  status: "active" | "inactive";
  created_at: string | null;
  file_url: string | null;
};

const fssaiRegex = /^\d{14}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const modalInputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const STATE_HINTS = [
  { state: "Andhra Pradesh", terms: ["andhra", "vijayawada", "vizianagaram", "vzm", "visakhapatnam", "tirupati"] },
  { state: "Madhya Pradesh", terms: ["madhya", "bhopal", "bpl", "ratlam", "itarsi", "jabalpur"] },
  { state: "Uttar Pradesh", terms: ["uttar pradesh", "kanpur", "lucknow", "v lakshmibai", "vglj", "prayagraj"] },
  { state: "Delhi", terms: ["delhi", "nizamuddin", "nzm", "new delhi"] },
  { state: "Maharashtra", terms: ["maharashtra", "mumbai", "nagpur", "pune", "bhusaval"] },
  { state: "Gujarat", terms: ["gujarat", "surat", "ahmedabad", "adi", "vadodara"] },
  { state: "Rajasthan", terms: ["rajasthan", "abu road", "jaipur", "jodhpur", "udaipur"] },
];

function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB") : "-";
}

function detectState(value: string) {
  const normalized = value.toLowerCase();
  return STATE_HINTS.find((entry) => entry.terms.some((term) => normalized.includes(term)))?.state || "";
}

function pick(row: any, ...keys: string[]) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return "";
}

function addressFrom(row: any) {
  return {
    RestroAddress: pick(row, "RestroAddress", "restro_address", "RestroAdress", "RestroAddres", "Address", "address", "OutletAddress", "outlet_address"),
    City: pick(row, "City", "city", "CityVillage", "City_Village", "City / Village", "city_village"),
    State: pick(row, "State", "state"),
    District: pick(row, "District", "district"),
    PinCode: pick(row, "PinCode", "pin_code", "Pincode", "PINCode", "Pin", "pin"),
    RestroLatitude: pick(row, "RestroLatitude", "restro_latitude", "Latitude", "latitude", "Lat", "lat"),
    RestroLongitude: pick(row, "RestroLongitude", "restro_longitude", "Longitude", "longitude", "Long", "long", "Lng", "lng"),
  };
}

function hasAddressValue(row: any) {
  const next = addressFrom(row);
  return Object.values(next).some((value) => String(value ?? "").trim() !== "");
}

function mergeFilledAddress(prev: any, next: any) {
  const out = { ...prev };
  Object.entries(addressFrom(next)).forEach(([key, value]) => {
    if (String(value ?? "").trim() !== "") out[key] = value;
  });
  return out;
}

export default function AddressDocsClient({
  initialData = {},
  restroCode = "",
}: Props) {
  const code = useMemo(
    () => restroCode || initialData?.RestroCode || initialData?.restroCode || "",
    [initialData, restroCode]
  );

  const [local, setLocal] = useState<any>({
    ...addressFrom(initialData),
  });

  const [fssaiRows, setFssaiRows] = useState<FssaiRow[]>([]);
  const [gstRows, setGstRows] = useState<GstRow[]>([]);
  const [panRows, setPanRows] = useState<PanRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState("");

  const [showFssai, setShowFssai] = useState(false);
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState("");
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [savingFssai, setSavingFssai] = useState(false);

  const [showGst, setShowGst] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstType, setGstType] = useState("Regular");
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [savingGst, setSavingGst] = useState(false);

  const [showPan, setShowPan] = useState(false);
  const [panNumber, setPanNumber] = useState("");
  const [panType, setPanType] = useState("");
  const [panFile, setPanFile] = useState<File | null>(null);
  const [savingPan, setSavingPan] = useState(false);

  useEffect(() => {
    if (!hasAddressValue(initialData)) return;
    setLocal((prev: any) => mergeFilledAddress(prev, initialData));
  }, [initialData]);

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function update(key: string, value: any) {
    setLocal((s: any) => {
      const next = { ...s, [key]: value };
      if (["RestroAddress", "City", "District"].includes(key)) {
        const detected = detectState(
          `${next.RestroAddress || ""} ${next.City || ""} ${next.District || ""}`
        );
        if (detected) next.State = detected;
      }
      return next;
    });
  }

  async function loadDocs() {
    if (!code) return;
    setLoadingDocs(true);
    try {
      const bust = Date.now();
      const [addressRes, fssaiRes, gstRes, panRes] = await Promise.all([
        fetch(`/api/restros/${encodeURIComponent(String(code))}/address-docs?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/restros/${encodeURIComponent(String(code))}/fssai?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/restros/${encodeURIComponent(String(code))}/gst?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/restros/${encodeURIComponent(String(code))}/pan?t=${bust}`, { cache: "no-store" }),
      ]);

      const [addressJson, fssaiJson, gstJson, panJson] = await Promise.all([
        addressRes.json().catch(() => ({})),
        fssaiRes.json(),
        gstRes.json(),
        panRes.json(),
      ]);

      if (addressJson?.ok && addressJson?.row) {
        setLocal((prev: any) => mergeFilledAddress(prev, addressJson.row));
      }
      setFssaiRows(fssaiJson?.ok ? fssaiJson.rows || [] : []);
      setGstRows(gstJson?.ok ? gstJson.rows || [] : []);
      setPanRows(panJson?.ok ? panJson.rows || [] : []);
    } catch (err) {
      console.error("Document load failed", err);
      setMessage("Failed to load document history");
    } finally {
      setLoadingDocs(false);
    }
  }

  async function saveAddress() {
    if (!code) {
      alert("Missing RestroCode");
      return;
    }

    setSavingAddress(true);
    setMessage("");
    try {
      const payload = {
        RestroAddress: local.RestroAddress ?? "",
        City: local.City ?? "",
        State: local.State ?? "",
        District: local.District ?? "",
        PinCode: local.PinCode ?? "",
        RestroLatitude: local.RestroLatitude ?? "",
        RestroLongitude: local.RestroLongitude ?? "",
      };

      let res = await fetch(`/api/restros/${encodeURIComponent(String(code))}/address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify(payload),
        });
        json = await res.json().catch(() => ({}));
      }

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      const savedAddress = json?.row ? addressFrom(json.row) : payload;
      const savedText = String(savedAddress.RestroAddress ?? "").trim();
      const inputText = String(payload.RestroAddress ?? "").trim();

      if (inputText && savedText !== inputText) {
        throw new Error("Address update verify failed. RestroMaster row did not return the saved address.");
      }

      setLocal((prev: any) => mergeFilledAddress({ ...prev, ...payload }, savedAddress));

      setMessage("Address saved in RestroMaster");
    } catch (err: any) {
      console.error("Address save failed", err);
      alert(err?.message || "Address save failed");
    } finally {
      setSavingAddress(false);
    }
  }

  async function submitFssai() {
    if (!fssaiRegex.test(fssaiNumber)) {
      alert("FSSAI number must be exactly 14 digits");
      return;
    }

    setSavingFssai(true);
    try {
      const fd = new FormData();
      fd.append("fssai_number", fssaiNumber);
      if (fssaiExpiry) fd.append("expiry_date", fssaiExpiry);
      if (fssaiFile) fd.append("file", fssaiFile);

      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}/fssai`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "FSSAI save failed");

      const savedRow: FssaiRow = {
        id: json.row?.id ?? json.row?.FssaiId ?? `${code}-${fssaiNumber}-${Date.now()}`,
        fssai_number: json.row?.fssai_number ?? fssaiNumber,
        expiry_date: json.row?.expiry_date ?? (fssaiExpiry || null),
        file_url: json.row?.file_url ?? null,
        status: "active",
        created_at: json.row?.created_at ?? new Date().toISOString(),
      };

      setFssaiRows((prev) => [
        savedRow,
        ...prev.map((r) => (r.status === "active" ? { ...r, status: "inactive" as const } : r)),
      ]);

      setShowFssai(false);
      setFssaiNumber("");
      setFssaiExpiry("");
      setFssaiFile(null);
      window.setTimeout(() => loadDocs(), 700);
    } catch (err: any) {
      alert(err?.message || "FSSAI save failed");
    } finally {
      setSavingFssai(false);
    }
  }

  async function submitGst() {
    if (!gstRegex.test(gstNumber)) {
      alert("Enter valid 15 digit GST number");
      return;
    }

    setSavingGst(true);
    try {
      const fd = new FormData();
      fd.append("gst_number", gstNumber);
      fd.append("gst_type", gstType);
      if (gstFile) fd.append("file", gstFile);

      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}/gst`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "GST save failed");

      const savedRow: GstRow = {
        id: json.row?.id ?? `${code}-${gstNumber}-${Date.now()}`,
        GstNumber: json.row?.GstNumber ?? gstNumber,
        GstType: json.row?.GstType ?? gstType,
        fileurl: json.row?.fileurl ?? null,
        Gststatus: "Active",
        createdDate: json.row?.createdDate ?? new Date().toISOString(),
      };

      setGstRows((prev) => [
        savedRow,
        ...prev.map((r) => (r.Gststatus === "Active" ? { ...r, Gststatus: "Inactive" as const } : r)),
      ]);

      setShowGst(false);
      setGstNumber("");
      setGstType("Regular");
      setGstFile(null);
      window.setTimeout(() => loadDocs(), 700);
    } catch (err: any) {
      alert(err?.message || "GST save failed");
    } finally {
      setSavingGst(false);
    }
  }

  async function submitPan() {
    if (!panRegex.test(panNumber)) {
      alert("Invalid PAN format (ABCDE1234F)");
      return;
    }

    setSavingPan(true);
    try {
      const fd = new FormData();
      fd.append("pan_number", panNumber);
      fd.append("pan_type", panType);
      if (panFile) fd.append("file", panFile);

      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}/pan`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "PAN save failed");

      const savedRow: PanRow = {
        id: json.row?.id ?? `${code}-${panNumber}-${Date.now()}`,
        pan_number: json.row?.PanNumber ?? panNumber,
        pan_type: json.row?.PanType ?? (panType || null),
        status: "active",
        created_at: json.row?.CreatedDate ?? new Date().toISOString(),
        file_url: json.row?.fileurl ?? null,
      };

      setPanRows((prev) => [
        savedRow,
        ...prev.map((r) => (r.status === "active" ? { ...r, status: "inactive" as const } : r)),
      ]);

      setShowPan(false);
      setPanNumber("");
      setPanType("");
      setPanFile(null);
      window.setTimeout(() => loadDocs(), 700);
    } catch (err: any) {
      alert(err?.message || "PAN save failed");
    } finally {
      setSavingPan(false);
    }
  }

  const activeFssai = fssaiRows.filter((r) => r.status === "active");
  const oldFssai = fssaiRows.filter((r) => r.status !== "active");
  const activeGst = gstRows.filter((r) => r.Gststatus === "Active");
  const oldGst = gstRows.filter((r) => r.Gststatus !== "Active");
  const activePan = panRows.filter((r) => r.status === "active");
  const oldPan = panRows.filter((r) => r.status !== "active");

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <AdminCard
          title="Address"
          actions={
            <AdminButton type="button" onClick={saveAddress} disabled={savingAddress}>
              {savingAddress ? "Saving..." : "Save Address"}
            </AdminButton>
          }
        >
          <AdminField label="Restro Address">
            <AdminTextarea
              value={local.RestroAddress ?? ""}
              onChange={(e) => update("RestroAddress", e.target.value)}
              className="min-h-16"
            />
          </AdminField>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Field label="City / Village" value={local.City} onChange={(v) => update("City", v)} />
            <Field label="State" value={local.State} onChange={(v) => update("State", v)} />
            <Field label="District" value={local.District} onChange={(v) => update("District", v)} />
            <Field label="Pin Code" value={local.PinCode} onChange={(v) => update("PinCode", v)} />
            <Field label="Latitude" value={local.RestroLatitude} onChange={(v) => update("RestroLatitude", v)} />
            <Field label="Longitude" value={local.RestroLongitude} onChange={(v) => update("RestroLongitude", v)} />
          </div>

          {message && <div className="mt-3 text-sm font-semibold text-green-700">{message}</div>}
        </AdminCard>

        <DocSection title="FSSAI" actionLabel="Add New FSSAI" onAction={() => setShowFssai(true)}>
          <div className="grid grid-cols-5 gap-3 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <div>FSSAI No</div>
            <div>Expiry</div>
            <div>Status</div>
            <div>Created</div>
            <div>Document</div>
          </div>
          {loadingDocs && <div className="px-3 py-3 text-sm text-slate-500">Loading...</div>}
          {!loadingDocs && fssaiRows.length === 0 && <Empty text="No FSSAI entries" />}
          {[...activeFssai, ...oldFssai].map((r) => (
            <div key={r.id} className={`grid grid-cols-5 gap-3 px-3 py-2 text-sm ${r.status === "active" ? "bg-green-50" : "bg-red-50"}`}>
              <div className="font-semibold">{r.fssai_number}</div>
              <div>{fmt(r.expiry_date)}</div>
              <Status active={r.status === "active"} />
              <div>{fmt(r.created_at)}</div>
              <DocLink url={r.file_url} />
            </div>
          ))}
        </DocSection>

        <DocSection title="GST" actionLabel="Add New GST" onAction={() => setShowGst(true)}>
          <div className="grid grid-cols-5 gap-3 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <div>GST No</div>
            <div>GST Type</div>
            <div>Status</div>
            <div>Created</div>
            <div>Document</div>
          </div>
          {!loadingDocs && gstRows.length === 0 && <Empty text="No GST entries" />}
          {[...activeGst, ...oldGst].map((r) => (
            <div key={r.id} className={`grid grid-cols-5 gap-3 px-3 py-2 text-sm ${r.Gststatus === "Active" ? "bg-green-50" : "bg-red-50"}`}>
              <div className="font-semibold">{r.GstNumber}</div>
              <div>{r.GstType || "-"}</div>
              <Status active={r.Gststatus === "Active"} />
              <div>{fmt(r.createdDate)}</div>
              <DocLink url={r.fileurl} />
            </div>
          ))}
        </DocSection>

        <DocSection title="PAN" actionLabel="Add New PAN" onAction={() => setShowPan(true)}>
          <div className="grid grid-cols-5 gap-3 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <div>PAN No</div>
            <div>PAN Type</div>
            <div>Status</div>
            <div>Created</div>
            <div>Document</div>
          </div>
          {!loadingDocs && panRows.length === 0 && <Empty text="No PAN entries" />}
          {[...activePan, ...oldPan].map((r) => (
            <div key={r.id} className={`grid grid-cols-5 gap-3 px-3 py-2 text-sm ${r.status === "active" ? "bg-green-50" : "bg-red-50"}`}>
              <div className="font-semibold">{r.pan_number}</div>
              <div>{r.pan_type || "-"}</div>
              <Status active={r.status === "active"} />
              <div>{fmt(r.created_at)}</div>
              <DocLink url={r.file_url} />
            </div>
          ))}
        </DocSection>
      </div>

      {showFssai && (
        <Modal title="Add FSSAI" onClose={() => setShowFssai(false)}>
          <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, "").slice(0, 14))} placeholder="14 Digit FSSAI Number" className={modalInputClass} />
          <input type="date" value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} className={modalInputClass} />
          <input type="file" onChange={(e) => setFssaiFile(e.target.files?.[0] || null)} />
          <ModalActions saving={savingFssai} onCancel={() => setShowFssai(false)} onSave={submitFssai} />
        </Modal>
      )}

      {showGst && (
        <Modal title="Add GST" onClose={() => setShowGst(false)}>
          <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))} placeholder="15 Digit GST Number" className={modalInputClass} />
          <select value={gstType} onChange={(e) => setGstType(e.target.value)} className={modalInputClass}>
            <option value="Regular">Regular</option>
            <option value="Composition">Composition</option>
          </select>
          <input type="file" onChange={(e) => setGstFile(e.target.files?.[0] || null)} />
          <ModalActions saving={savingGst} onCancel={() => setShowGst(false)} onSave={submitGst} />
        </Modal>
      )}

      {showPan && (
        <Modal title="Add PAN" onClose={() => setShowPan(false)}>
          <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder="ABCDE1234F" className={modalInputClass} />
          <select value={panType} onChange={(e) => setPanType(e.target.value)} className={modalInputClass}>
            <option value="">Select PAN Type</option>
            <option value="Proprietor">Proprietor</option>
            <option value="Company">Company</option>
            <option value="Partnership">Partnership</option>
            <option value="Individual">Individual</option>
          </select>
          <input type="file" onChange={(e) => setPanFile(e.target.files?.[0] || null)} />
          <ModalActions saving={savingPan} onCancel={() => setShowPan(false)} onSave={submitPan} />
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <AdminField label={label}>
      <AdminInput value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </AdminField>
  );
}

function DocSection({ title, actionLabel, onAction, children }: { title: string; actionLabel: string; onAction: () => void; children: React.ReactNode }) {
  return (
    <AdminCard
      title={title}
      actions={
        <AdminButton type="button" variant="primary" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      }
      bodyClassName="p-0"
    >
      {children}
    </AdminCard>
  );
}

function Status({ active }: { active: boolean }) {
  return <span className={active ? "font-semibold text-green-700" : "font-semibold text-red-700"}>{active ? "Active" : "Inactive"}</span>;
}

function DocLink({ url }: { url?: string | null }) {
  if (!url) return <div>-</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline">
      View
    </a>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-3 py-3 text-sm text-slate-500">{text}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1 text-sm">
            Close
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <AdminButton type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </AdminButton>
      <AdminButton type="button" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </AdminButton>
    </div>
  );
}
