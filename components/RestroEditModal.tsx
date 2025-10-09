"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Restro = any;

type SaveResult =
  | { ok: true; row?: any }
  | { ok: false; error: any };

type StationsOption = { label: string; value: string };

/* ----------------- small subcomponents (defined first to avoid TS hoisting issues) ----------------- */

function TextRow({ label, value, onChange, placeholder, readOnly = false, error }: any) {
  return (
    <div className="grid grid-cols-5 gap-3 items-center py-2">
      <div className="col-span-1 text-sm text-gray-700">{label}</div>
      <div className="col-span-4">
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full border rounded px-2 py-2 ${readOnly ? "bg-gray-100" : ""}`}
        />
        {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
      </div>
    </div>
  );
}

function BasicInfoTab({ restro, onChange, validationErrors }: any) {
  const r = restro ?? {};
  return (
    <div>
      <h3 className="font-semibold mb-2">Basic Information</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow
            label="Restro Code"
            value={r?.restro_code ?? r?.RestroCode}
            onChange={(v: any) => onChange("restro_code", v)}
            readOnly
          />

          <TextRow
            label="Station Code with Name"
            value={r?.station_code_with_name ?? r?.StationCodeWithName ?? ""}
            onChange={() => {}}
            placeholder="(read-only)"
            readOnly
          />

          <TextRow label="Restro Name" value={r?.restro_name ?? r?.RestroName} onChange={(v: any) => onChange("restro_name", v)} />
          <TextRow label="Brand Name if Any" value={r?.brand_name ?? r?.BrandName} onChange={(v: any) => onChange("brand_name", v)} />

          <div className="mt-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!(r?.raileats_status ?? r?.RailEatsStatus)}
                onChange={(e) => onChange("raileats_status", e.target.checked ? 1 : 0)}
              />
              <span className="text-sm">RailEats Status (on/off)</span>
            </label>
          </div>

          <div className="mt-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!(r?.is_irctc_approved ?? r?.IsIrctcApproved)}
                onChange={(e) => onChange("is_irctc_approved", e.target.checked ? 1 : 0)}
              />
              <span className="text-sm">Is IRCTC Approved</span>
            </label>
          </div>
        </div>

        <div>
          <TextRow label="Owner Name" value={r?.owner_name ?? r?.OwnerName} onChange={(v: any) => onChange("owner_name", v)} />
          <TextRow
            label="Owner Email"
            value={r?.owner_email ?? r?.OwnerEmail}
            onChange={(v: any) => onChange("owner_email", v)}
            error={validationErrors?.owner_email}
          />
          <TextRow
            label="Owner Phone"
            value={r?.owner_phone ?? r?.OwnerPhone}
            onChange={(v: any) => onChange("owner_phone", v)}
            error={validationErrors?.owner_phone}
            placeholder="max 10 digits"
          />
          <TextRow
            label="Restro Email"
            value={r?.restro_email ?? r?.RestroEmail}
            onChange={(v: any) => onChange("restro_email", v)}
            error={validationErrors?.restro_email}
          />
          <TextRow
            label="Restro Phone"
            value={r?.restro_phone ?? r?.RestroPhone}
            onChange={(v: any) => onChange("restro_phone", v)}
            error={validationErrors?.restro_phone}
            placeholder="max 10 digits"
          />
        </div>
      </div>
    </div>
  );
}

function StationSettingsTab({ restro, onChange, stationsOptions = [] }: any) {
  const safeOptions: StationsOption[] = Array.isArray(stationsOptions) ? stationsOptions : [];
  const r = restro ?? {};
  return (
    <div>
      <h3 className="font-semibold mb-2">Station Settings</h3>

      {safeOptions.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm">Select Station</label>
          <select value={r?.station_code ?? r?.StationCode ?? ""} onChange={(e) => onChange("station_code", e.target.value)} className="mt-1 w-full border rounded px-2 py-1">
            <option value="">— select —</option>
            {safeOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Fix from Basic Information (NGP)" value={r?.fix_from_basic_info ?? r?.FixFromBasicInfo} onChange={(v: any) => onChange("fix_from_basic_info", v)} />
          <TextRow label="Station Category" value={r?.station_category ?? r?.StationCategory} onChange={(v: any) => onChange("station_category", v)} />
          <TextRow label="Open Time" value={r?.open_time ?? r?.OpenTime} onChange={(v: any) => onChange("open_time", v)} />
          <TextRow label="Close Time" value={r?.close_time ?? r?.CloseTime} onChange={(v: any) => onChange("close_time", v)} />
        </div>

        <div>
          <TextRow label="Weekly Off" value={r?.weekly_off ?? r?.WeeklyOff} onChange={(v: any) => onChange("weekly_off", v)} />
          <TextRow label="Minimum Order Value" value={r?.minimum_order_value ?? r?.MinimumOrderValue} onChange={(v: any) => onChange("minimum_order_value", v)} />
          <TextRow label="Cut Off Time" value={r?.cut_off_time ?? r?.CutOffTime} onChange={(v: any) => onChange("cut_off_time", v)} />
          <TextRow label="RailEats Customer Delivery Charge" value={r?.customer_delivery_charge ?? r?.CustomerDeliveryCharge} onChange={(v: any) => onChange("customer_delivery_charge", v)} />
        </div>
      </div>
    </div>
  );
}

function AddressDocsTab({ restro, onChange, restroCode }: any) {
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

function ContactsTab({ restro, onChange }: any) {
  function EmailRow({ idx }: { idx: number }) {
    const nameKey = `email_name_${idx}`;
    const emailKey = `email_for_orders_${idx}`;
    const statusKey = `email_status_${idx}`;
    return (
      <div className="grid grid-cols-6 gap-2 items-center py-2">
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
      <div className="grid grid-cols-6 gap-2 items-center py-2">
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

/* ----------------- main modal component ----------------- */

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

  // Ensure stationsOptions is always an array to avoid null access errors
  const stationOptions: StationsOption[] = Array.isArray(props.stationsOptions) ? props.stationsOptions : [];

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

  // --- Validation logic ---
  function isEmailValid(email: string | undefined | null) {
    if (!email) return false;
    // simple but stricter validation: must have something@something.something
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
  function isPhoneValid(phone: string | undefined | null) {
    if (!phone) return true; // optional
    const digits = String(phone).replace(/[^0-9]/g, "");
    return digits.length <= 10; // user requested 10 digits max
  }

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    const r = restro ?? providedRestro ?? {};
    if (!isEmailValid(r?.owner_email ?? r?.OwnerEmail)) errs.owner_email = "Owner email must contain @ and .";
    if (!isEmailValid(r?.restro_email ?? r?.RestroEmail)) errs.restro_email = "Restro email must contain @ and .";
    if (!isPhoneValid(r?.owner_phone ?? r?.OwnerPhone)) errs.owner_phone = "Owner phone must be at most 10 digits.";
    if (!isPhoneValid(r?.restro_phone ?? r?.RestroPhone)) errs.restro_phone = "Restro phone must be at most 10 digits.";
    return errs;
  }, [restro, providedRestro]);

  const isFormValid = useMemo(() => Object.keys(validationErrors).length === 0, [validationErrors]);

  if (!open) return null;

  // Modal layout: header (fixed inside modal), content (scrollable), footer (sticky bottom)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="
          bg-white rounded-lg shadow-2xl
          w-[95vw] md:w-[90vw]
          max-w-[1400px]
          h-auto md:h-[90vh]
          flex flex-col
          overflow-hidden
          p-0
          ring-1 ring-black/5
        "
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar inside modal: title + subtitle + close button */}
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <div className="text-xl font-semibold">{(restro ?? providedRestro)?.restro_code ?? (restro ?? providedRestro)?.RestroCode ? `${(restro ?? providedRestro)?.restro_code ?? (restro ?? providedRestro)?.RestroCode} / ${(restro ?? providedRestro)?.restro_name ?? (restro ?? providedRestro)?.RestroName ?? ""}` : "Edit Restro"}</div>
            <div className="text-sm text-teal-700">{(restro ?? providedRestro)?.station_code_with_name ?? (restro ?? providedRestro)?.StationCodeWithName ?? ""}</div>
          </div>

          <div>
            <button
              aria-label="close"
              onClick={handleClose}
              className="bg-red-500 hover:bg-red-600 text-white rounded p-3 ml-3"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs + content area */}
        <div className="p-6 overflow-auto flex-1">
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

          {loading && <div className="mb-3 text-sm text-gray-500">Loading...</div>}

          {activeTab === "basic" && (
            <BasicInfoTab restro={restro ?? providedRestro} onChange={onFieldChange} validationErrors={validationErrors} />
          )}

          {activeTab === "station" && (
            <StationSettingsTab restro={restro ?? providedRestro} onChange={onFieldChange} stationsOptions={stationOptions} />
          )}

          {activeTab === "address" && (
            <AddressDocsTab
              restro={restro ?? providedRestro}
              onChange={onFieldChange}
              restroCode={providedRestroCode ?? (restro ?? providedRestro)?.restro_code ?? (restro ?? providedRestro)?.RestroCode}
            />
          )}

          {activeTab === "contact" && <ContactsTab restro={restro ?? providedRestro} onChange={onFieldChange} />}
        </div>

        {/* Footer bar */}
        <div className="border-t px-6 py-4 flex items-center justify-end gap-3 bg-white">
          <div className="flex-1 text-sm text-red-600">
            {!isFormValid && Object.values(validationErrors)[0]}
          </div>
          <button
            className="px-4 py-2 rounded border"
            onClick={() => {
              setDirty(false);
              handleClose();
            }}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${!isFormValid || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={handleSave}
            disabled={!isFormValid || loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
