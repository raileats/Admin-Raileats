// components/RestroEditModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Restro = any;
type SaveResult = { ok: true; row?: any } | { ok: false; error: any };
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

  // Defensive defaults
  const providedRestro = props.restro ?? null;
  const providedRestroCode =
    props.restroCode ?? (providedRestro?.restro_code ?? providedRestro?.code ?? null);
  const initialOpen = props.isOpen ?? true;
  const initialTab = props.initialTab ?? "Basic Information";
  const onCloseProp = props.onClose;
  const callerOnSave = props.onSave;
  const stationOptions = props.stationsOptions ?? []; // <-- important: default to empty array

  const [activeTab, setActiveTab] = useState<string>(
    initialTab === "Basic Information" ? "basic" : initialTab?.toLowerCase() ?? "basic"
  );
  const [loading, setLoading] = useState(false);
  const [restro, setRestro] = useState<Restro | null>(providedRestro);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<boolean>(!!initialOpen);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // hide page-level header (one-time: only if page has .page-restro-header)
  useEffect(() => {
    // toggle body scroll lock when modal open
    if (open) {
      document.body.style.overflow = "hidden";
      document.querySelectorAll(".page-restro-header").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    } else {
      document.body.style.overflow = "";
      document.querySelectorAll(".page-restro-header").forEach((el) => {
        (el as HTMLElement).style.display = ""; // restore
      });
    }
    return () => {
      document.body.style.overflow = "";
      document.querySelectorAll(".page-restro-header").forEach((el) => {
        (el as HTMLElement).style.display = "";
      });
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

  // simple validation example (email contains @ and ., phones max 10 digits)
  function validate(payload: any) {
    setValidationMessage(null);
    const ownerEmail = payload?.owner_email ?? payload?.OwnerEmail ?? "";
    const restroEmail = payload?.restro_email ?? payload?.RestroEmail ?? "";
    const ownerPhone = (payload?.owner_phone ?? payload?.OwnerPhone ?? "") + "";
    const restroPhone = (payload?.restro_phone ?? payload?.RestroPhone ?? "") + "";

    if (ownerEmail && (!ownerEmail.includes("@") || !ownerEmail.includes("."))) {
      setValidationMessage("Owner email looks invalid");
      return false;
    }
    if (restroEmail && (!restroEmail.includes("@") || !restroEmail.includes("."))) {
      setValidationMessage("Restro email looks invalid");
      return false;
    }
    if (ownerPhone && ownerPhone.replace(/\D/g, "").length > 10) {
      setValidationMessage("Owner phone must be at most 10 digits");
      return false;
    }
    if (restroPhone && restroPhone.replace(/\D/g, "").length > 10) {
      setValidationMessage("Restro phone must be at most 10 digits");
      return false;
    }
    return true;
  }

  async function defaultSave(payload: any): Promise<SaveResult> {
    const code = providedRestroCode ?? payload?.restro_code ?? payload?.code ?? null;
    if (!code) return { ok: false, error: "missing_restro_code" };

    if (!validate(payload)) return { ok: false, error: validationMessage ?? "validation_failed" };

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
    const payload = { ...(restro ?? providedRestro) };
    setLoading(true);
    try {
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
        setValidationMessage(String(err));
      }
    } catch (err: any) {
      console.error(err);
      setValidationMessage(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    if (onCloseProp) onCloseProp();
    else router.back();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 p-4">
      <div
        className="bg-white rounded-lg shadow-2xl w-[95vw] md:w-[90vw] max-w-[1400px] max-h-[94vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header (sticky inside modal) */}
        <div className="sticky top-0 z-20 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">
              {providedRestroCode ?? restro?.restro_code ?? restro?.RestroCode}{" "}
              <span className="text-base font-normal text-gray-600">/ {restro?.restro_name ?? restro?.RestroName}</span>
            </div>
            <div className="text-sm text-teal-600">{restro?.station_code_with_name ?? restro?.StationCodeWithName ?? ""}</div>
          </div>
          <button
            onClick={() => handleClose()}
            className="ml-4 inline-flex items-center justify-center bg-red-500 text-white rounded p-2 hover:opacity-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-6 overflow-auto flex-1">
          <div className="flex gap-2 mb-4">
            <button className={`px-3 py-1 rounded ${activeTab === "basic" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("basic")}>
              Basic Information
            </button>
            <button className={`px-3 py-1 rounded ${activeTab === "station" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("station")}>
              Station Settings
            </button>
            <button className={`px-3 py-1 rounded ${activeTab === "address" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("address")}>
              Address & Documents
            </button>
            <button className={`px-3 py-1 rounded ${activeTab === "contact" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("contact")}>
              Contacts
            </button>
          </div>

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
                providedRestroCode ?? (restro ?? providedRestro)?.restro_code ?? (restro ?? providedRestro)?.RestroCode
              }
            />
          )}
          {activeTab === "contact" && <ContactsTab restro={restro ?? providedRestro} onChange={onFieldChange} />}
        </div>

        {/* Footer (sticky) */}
        <div className="sticky bottom-0 z-20 bg-white border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-red-600">{validationMessage}</div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded border" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSave} disabled={!dirty || loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- small subcomponents ----------------- */

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
          <TextRow label="Station Code with Name" value={restro?.station_code_with_name ?? restro?.StationCodeWithName ?? "(read-only)"} onChange={() => {}} readOnly />
          <TextRow label="Restro Name" value={restro?.restro_name ?? restro?.RestroName} onChange={(v: any) => onChange("restro_name", v)} />
          <TextRow label="Brand Name if Any" value={restro?.brand_name ?? restro?.BrandName} onChange={(v: any) => onChange("brand_name", v)} />
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={(e)=>onChange("raileats_status", e.target.checked?1:0)} checked={!!(restro?.raileats_status ?? restro?.RailEatsStatus)} />RailEats Status (on/off)</label>
          </div>
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={(e)=>onChange("is_irctc_approved", e.target.checked?1:0)} checked={!!(restro?.is_irctc_approved ?? restro?.IsIrctcApproved)} />Is IRCTC Approved</label>
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
      {/* other fields omitted for brevity — keep as in your original component */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Fix from Basic Information (NGP)" value={restro?.fix_from_basic_info ?? restro?.FixFromBasicInfo} onChange={(v: any) => onChange("fix_from_basic_info", v)} />
        </div>
        <div>
          <TextRow label="Minimum Order Value" value={restro?.minimum_order_value ?? restro?.MinimumOrderValue} onChange={(v: any) => onChange("minimum_order_value", v)} />
        </div>
      </div>
    </div>
  );
}

function AddressDocsTab({ restro, onChange, restroCode }: { restro: any; onChange: (k: string, v: any) => void; restroCode: string }) {
  // keep existing logic from your file (omitted here for brevity)
  return (
    <div>
      <h3 className="font-semibold mb-2">Address</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Restro Address" value={restro?.restro_address ?? restro?.RestroAddress} onChange={(v: any) => onChange("restro_address", v)} />
          <TextRow label="City / Village" value={restro?.city ?? restro?.City} onChange={(v: any) => onChange("city", v)} />
        </div>
        <div>
          <TextRow label="State (non-editable)" value={restro?.state ?? restro?.State} onChange={() => {}} readOnly />
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ restro, onChange }: { restro: any; onChange: (k: string, v: any) => void }) {
  // keep existing contact UI (omitted for brevity)
  return (
    <div>
      <h3 className="font-semibold mb-2">Contact</h3>
      <div className="grid grid-cols-6 gap-2">
        <div className="col-span-2">
          <input value={restro?.contact_name_1 ?? ""} onChange={(e) => onChange("contact_name_1", e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="col-span-2">
          <input value={restro?.contact_value_1 ?? ""} onChange={(e) => onChange("contact_value_1", e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
      </div>
    </div>
  );
}
