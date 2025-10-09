"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Restro = any;

type SaveResult =
  | { ok: true; row?: any }
  | { ok: false; error: any };

type StationsOption = { label: string; value: string };

type Props = {
  restroCode?: string;
  isOpen?: boolean;
  restro?: Restro;
  initialTab?: string;
  stationsOptions?: StationsOption[] | null;
  onClose?: () => void;
  onSave?: (payload: any) => Promise<SaveResult>;
};

export default function RestroEditModal(props: Props) {
  const router = useRouter();

  const providedRestro = props.restro ?? null;
  const providedRestroCode =
    props.restroCode ?? (providedRestro?.restro_code ?? providedRestro?.code ?? null);
  const initialOpen = props.isOpen ?? true;
  const initialTab = props.initialTab ?? "Basic Information";
  const onCloseProp = props.onClose;
  const callerOnSave = props.onSave;
  // default stationsOptions to empty array to avoid null errors
  const stationOptions: StationsOption[] = props.stationsOptions ?? [];

  const [activeTab, setActiveTab] = useState<string>(
    initialTab === "Basic Information" ? "basic" : initialTab?.toLowerCase() ?? "basic"
  );
  const [loading, setLoading] = useState(false);
  const [restro, setRestro] = useState<Restro | null>(providedRestro);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<boolean>(!!initialOpen);

  useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  // add/remove body class so parent page header can be hidden via CSS when modal open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => {
      if (typeof document !== "undefined") document.body.classList.remove("modal-open");
    };
  }, [open]);

  // Fetch restro if only restroCode provided
  useEffect(() => {
    if (providedRestro) return;
    if (!providedRestroCode || !open) return;

    let mounted = true;
    setLoading(true);
    fetch(`/api/restros/${providedRestroCode}`)
      .then((r) => r.json())
      .then((data) => {
        const payload = data?.data ?? data;
        if (mounted) setRestro(payload);
      })
      .catch((e) => console.error(e))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [providedRestroCode, providedRestro, open]);

  function onFieldChange(path: string, value: any) {
    setRestro((prev: any) => {
      const next = { ...(prev || {}) };
      next[path] = value;
      return next;
    });
    setDirty(true);
  }

  async function defaultSave(payload: any): Promise<SaveResult> {
    const code = providedRestroCode ?? payload?.restro_code ?? payload?.code ?? null;
    if (!code) return { ok: false, error: "missing_restro_code" };

    try {
      const res = await fetch(`/api/restros/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: text || "patch_failed" };
      }
      const json = await res.json();
      return { ok: true, row: json };
    } catch (err) {
      return { ok: false, error: err };
    }
  }

  async function handleSave() {
    if (!restro && !providedRestro) {
      alert("Nothing to save");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...(restro ?? providedRestro) };
      const saveFn = callerOnSave ?? defaultSave;
      const result = await saveFn(payload);
      if (result.ok) {
        setDirty(false);
        setOpen(false);
        if (onCloseProp) onCloseProp();
        else router.back();
      } else {
        const err = (result as { ok: false; error: any }).error ?? result;
        console.error("save error", err);
        alert("Save failed: " + String(err ?? "unknown"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Save failed: " + String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    if (onCloseProp) onCloseProp();
    else router.back();
  }

  if (typeof document === "undefined") {
    // SSR-safe: modal only mounts on client
    return null;
  }

  // Modal markup (same structure as before) rendered into a portal to avoid layout overlap
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="
          bg-white rounded-lg shadow-2xl
          w-[95vw] md:w-[90vw]
          max-w-[1400px]
          h-auto md:h-[90vh]
          overflow-auto
          p-6
          ring-1 ring-black/5
        "
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {/* Title inside modal - THIS is the authoritative title */}
            {providedRestroCode ?? restro?.restro_code ?? restro?.RestroCode} / {restro?.restro_name ?? restro?.RestroName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border"
              onClick={() => {
                setRestro(null);
                setDirty(false);
                handleClose();
              }}
            >
              Close
            </button>
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white"
              onClick={handleSave}
              disabled={!dirty || loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded ${activeTab === "basic" ? "bg-amber-100" : "bg-gray-100"}`}
            onClick={() => setActiveTab("basic")}
          >
            Basic Information
          </button>
          <button
            className={`px-3 py-1 rounded ${activeTab === "station" ? "bg-amber-100" : "bg-gray-100"}`}
            onClick={() => setActiveTab("station")}
          >
            Station Settings
          </button>
          <button
            className={`px-3 py-1 rounded ${activeTab === "address" ? "bg-amber-100" : "bg-gray-100"}`}
            onClick={() => setActiveTab("address")}
          >
            Address & Documents
          </button>
          <button
            className={`px-3 py-1 rounded ${activeTab === "contact" ? "bg-amber-100" : "bg-gray-100"}`}
            onClick={() => setActiveTab("contact")}
          >
            Contacts
          </button>
        </div>

        <div>
          {loading && <div className="mb-3 text-sm text-gray-500">Loading...</div>}

          {activeTab === "basic" && <BasicInfoTab restro={restro ?? providedRestro} onChange={onFieldChange} />}

          {activeTab === "station" && (
            <StationSettingsTab restro={restro ?? providedRestro} onChange={onFieldChange} stationsOptions={stationOptions} />
          )}

          {activeTab === "address" && (
            <AddressDocsTab
              restro={restro ?? providedRestro}
              onChange={onFieldChange}
              restroCode={
                providedRestroCode ??
                (restro ?? providedRestro)?.restro_code ??
                (restro ?? providedRestro)?.RestroCode
              }
            />
          )}

          {activeTab === "contact" && <ContactsTab restro={restro ?? providedRestro} onChange={onFieldChange} />}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ----------------- small subcomponents (same as before) ----------------- */

function TextRow({ label, value, onChange, placeholder, readOnly = false }: any) {
  return (
    <div className="grid grid-cols-5 gap-3 items-center py-1">
      <div className="col-span-1 text-sm text-gray-700">{label}</div>
      <div className="col-span-4">
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full border rounded px-2 py-1 ${readOnly ? "bg-gray-100" : ""}`}
        />
      </div>
    </div>
  );
}

function BasicInfoTab({ restro, onChange }: { restro: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Basic Information</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Restro Code" value={restro?.restro_code ?? restro?.RestroCode} onChange={(v: any) => onChange("restro_code", v)} />
          <TextRow
            label="Station Code with Name"
            value={restro?.station_code_with_name ?? restro?.StationCodeWithName ?? "(read-only)"}
            onChange={(v: any) => onChange("station_code_with_name", v)}
            readOnly
          />
          <TextRow label="Restro Name" value={restro?.restro_name ?? restro?.RestroName} onChange={(v: any) => onChange("restro_name", v)} />
          <TextRow label="Brand Name if Any" value={restro?.brand_name ?? restro?.BrandName} onChange={(v: any) => onChange("brand_name", v)} />
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!restro?.raileats_status ?? !!restro?.RailEatsStatus} onChange={(e) => onChange("raileats_status", e.target.checked ? 1 : 0)} />
              RailEats Status (on/off)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!restro?.is_irctc_approved ?? !!restro?.IsIrctcApproved} onChange={(e) => onChange("is_irctc_approved", e.target.checked ? 1 : 0)} />
              Is IRCTC Approved
            </label>
          </div>
        </div>

        <div>
          <TextRow label="Owner Name" value={restro?.owner_name ?? restro?.OwnerName} onChange={(v: any) => onChange("owner_name", v)} />
          <TextRow label="Owner Email" value={restro?.owner_email ?? restro?.OwnerEmail} onChange={(v: any) => onChange("owner_email", v)} />
          <TextRow label="Owner Phone" value={restro?.owner_phone ?? restro?.OwnerPhone} onChange={(v: any) => onChange("owner_phone", v)} />
          <TextRow label="Restro Email" value={restro?.restro_email ?? restro?.RestroEmail} onChange={(v: any) => onChange("restro_email", v)} />
          <TextRow label="Restro Phone" value={restro?.restro_phone ?? restro?.RestroPhone} onChange={(v: any) => onChange("restro_phone", v)} />
        </div>
      </div>
    </div>
  );
}

function StationSettingsTab({ restro, onChange, stationsOptions }: { restro: any; onChange: (k: string, v: any) => void; stationsOptions?: StationsOption[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Station Settings</h3>

      {stationsOptions && stationsOptions.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm">Select Station</label>
          <select value={restro?.station_code ?? restro?.StationCode ?? ""} onChange={(e) => onChange("station_code", e.target.value)} className="mt-1 w-full border rounded px-2 py-1">
            <option value="">— select —</option>
            {stationsOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Fix from Basic Information (NGP)" value={restro?.fix_from_basic_info ?? restro?.FixFromBasicInfo} onChange={(v: any) => onChange("fix_from_basic_info", v)} />
          <TextRow label="Station Category" value={restro?.station_category ?? restro?.StationCategory} onChange={(v: any) => onChange("station_category", v)} />
          <TextRow label="Open Time" value={restro?.open_time ?? restro?.OpenTime} onChange={(v: any) => onChange("open_time", v)} />
          <TextRow label="Close Time" value={restro?.close_time ?? restro?.CloseTime} onChange={(v: any) => onChange("close_time", v)} />
        </div>

        <div>
          <TextRow label="Weekly Off" value={restro?.weekly_off ?? restro?.WeeklyOff} onChange={(v: any) => onChange("weekly_off", v)} />
          <TextRow label="Minimum Order Value" value={restro?.minimum_order_value ?? restro?.MinimumOrderValue} onChange={(v: any) => onChange("minimum_order_value", v)} />
          <TextRow label="Cut Off Time" value={restro?.cut_off_time ?? restro?.CutOffTime} onChange={(v: any) => onChange("cut_off_time", v)} />
          <TextRow label="RailEats Customer Delivery Charge" value={restro?.customer_delivery_charge ?? restro?.CustomerDeliveryCharge} onChange={(v: any) => onChange("customer_delivery_charge", v)} />
        </div>
      </div>
    </div>
  );
}

function AddressDocsTab({ restro, onChange, restroCode }: { restro: any; onChange: (k: string, v: any) => void; restroCode: string }) {
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState("");
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!restro) return;
    setFssaiNumber(restro?.fssai_number ?? restro?.FSSAINumber ?? "");
    setFssaiExpiry(restro?.fssai_expiry ?? restro?.FSSAIExpiry ?? "");
  }, [restro]);

  function validateFssaiExpiry(dateStr: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()); // at least 1 month
    return d >= min;
  }

  async function uploadFileToServer(file: File) {
    const filename = file.name || `upload_${Date.now()}`;
    const contentType = file.type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();

    const res = await fetch(`/api/restros/${restroCode}/upload-file`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "x-file-name": filename,
      },
      body: arrayBuffer,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error("Upload failed: " + text);
    }
    const data = await res.json();
    return data.file_url as string;
  }

  async function addNewFssaiEntry() {
    if (!validateFssaiExpiry(fssaiExpiry)) {
      alert("FSSAI expiry must be at least 1 month from today");
      return;
    }

    setUploading(true);
    try {
      let file_url: string | null = null;
      if (fssaiFile) {
        file_url = await uploadFileToServer(fssaiFile);
      }

      const body = { type: "fssai", fssai_number: fssaiNumber, fssai_expiry: fssaiExpiry, file_url };
      const res = await fetch(`/api/restros/${restroCode}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to add FSSAI");
      }

      alert("FSSAI added");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Address</h3>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <TextRow label="Restro Address" value={restro?.restro_address ?? restro?.RestroAddress} onChange={(v: any) => onChange("restro_address", v)} />
          <TextRow label="City / Village" value={restro?.city ?? restro?.City} onChange={(v: any) => onChange("city", v)} />
          <TextRow label="Pin Code" value={restro?.pin_code ?? restro?.PinCode} onChange={(v: any) => onChange("pin_code", v)} />
          <TextRow label="Restro Latitude" value={restro?.restro_latitude ?? restro?.RestroLatitude} onChange={(v: any) => onChange("restro_latitude", v)} />
        </div>
        <div>
          <TextRow label="State (non-editable)" value={restro?.state ?? restro?.State} onChange={() => {}} readOnly />
          <TextRow label="District (non-editable)" value={restro?.district ?? restro?.District} onChange={() => {}} readOnly />
          <TextRow label="Restro Longitude" value={restro?.restro_longitude ?? restro?.RestroLongitude} onChange={(v: any) => onChange("restro_longitude", v)} />
        </div>
      </div>

      <h3 className="font-semibold mb-2">Documents</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3">
          <div className="grid grid-cols-6 gap-2 items-center">
            <div className="col-span-1 text-sm">FSSAI Number</div>
            <div className="col-span-2">
              <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="col-span-2">
              <input type="date" value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="col-span-1">
              <input type="file" onChange={(e: any) => setFssaiFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="mt-3">
            <button className="px-3 py-1 rounded bg-green-500 text-white" onClick={addNewFssaiEntry} disabled={uploading}>
              {uploading ? "Uploading..." : "Add New FSSAI Entry"}
            </button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-6 gap-2 items-center mt-4">
            <div className="col-span-1 text-sm">GST Number</div>
            <div className="col-span-5">
              <input value={restro?.gst_number ?? restro?.GSTNumber ?? ""} onChange={(e) => onChange("gst_number", e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="mt-2">
            <button
              className="px-3 py-1 rounded bg-blue-500 text-white"
              onClick={async () => {
                const res = await fetch(`/api/restros/${restroCode}/docs`, {
                  method: "POST",
                  body: JSON.stringify({ type: "gst", gst_number: restro?.gst_number ?? restro?.GSTNumber }),
                  headers: { "Content-Type": "application/json" },
                });
                if (!res.ok) {
                  const text = await res.text();
                  alert("Failed to add GST: " + text);
                  return;
                }
                alert("GST added");
                window.location.reload();
              }}
            >
              Add New GST Entry
            </button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-6 gap-2 items-center mt-4">
            <div className="col-span-1 text-sm">PAN Number</div>
            <div className="col-span-5">
              <input value={restro?.pan_number ?? restro?.PANNumber ?? ""} onChange={(e) => onChange("pan_number", e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="mt-2">
            <button
              className="px-3 py-1 rounded bg-amber-600 text-white"
              onClick={async () => {
                const res = await fetch(`/api/restros/${restroCode}/docs`, {
                  method: "POST",
                  body: JSON.stringify({ type: "pan", pan_number: restro?.pan_number ?? restro?.PANNumber }),
                  headers: { "Content-Type": "application/json" },
                });
                if (!res.ok) {
                  const text = await res.text();
                  alert("Failed to add PAN: " + text);
                  return;
                }
                alert("PAN added");
                window.location.reload();
              }}
            >
              Add New PAN Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ restro, onChange }: { restro: any; onChange: (k: string, v: any) => void }) {
  function EmailRow({ idx }: { idx: number }) {
    const nameKey = `email_name_${idx}`;
    const emailKey = `email_for_orders_${idx}`;
    const statusKey = `email_status_${idx}`;
    return (
      <div className="grid grid-cols-6 gap-2 items-center py-1">
        <div className="col-span-1 text-sm">Name</div>
        <div className="col-span-1">
          <input value={restro?.[nameKey] ?? restro?.[`EmailAddressName${idx}`] ?? ""} onChange={(e) => onChange(nameKey, e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-2">
          <input value={restro?.[emailKey] ?? restro?.[`EmailsforOrdersReceiving${idx}`] ?? ""} onChange={(e) => onChange(emailKey, e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-1">
          <label className="flex items-center">
            <input type="checkbox" checked={!!restro?.[statusKey] ?? !!restro?.[`EmailAddressStatus${idx}`]} onChange={(e) => onChange(statusKey, e.target.checked)} className="mr-2" />
            Status
          </label>
        </div>
        <div className="col-span-1"></div>
      </div>
    );
  }

  function WpRow({ idx }: { idx: number }) {
    const nameKey = `wp_name_${idx}`;
    const numKey = `wp_num_${idx}`;
    const statusKey = `wp_status_${idx}`;
    return (
      <div className="grid grid-cols-6 gap-2 items-center py-1">
        <div className="col-span-1 text-sm">Name</div>
        <div className="col-span-1">
          <input value={restro?.[nameKey] ?? restro?.[`WhatsappMobileNumberName${idx}`] ?? ""} onChange={(e) => onChange(nameKey, e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-2">
          <input value={restro?.[numKey] ?? restro?.[`WhatsappMobileNumberforOrderDetails${idx}`] ?? ""} onChange={(e) => onChange(numKey, e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-1">
          <label className="flex items-center">
            <input type="checkbox" checked={!!restro?.[statusKey] ?? !!restro?.[`WhatsappMobileNumberStatus${idx}`]} onChange={(e) => onChange(statusKey, e.target.checked)} className="mr-2" />
            Status
          </label>
        </div>
        <div className="col-span-1"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Contact</h3>
      <div>
        <h4 className="font-medium mt-2">Emails</h4>
        <EmailRow idx={1} />
        <EmailRow idx={2} />
      </div>
      <div>
        <h4 className="font-medium mt-2">WhatsApp Mobiles</h4>
        <WpRow idx={1} />
        <WpRow idx={2} />
      </div>
    </div>
  );
}
