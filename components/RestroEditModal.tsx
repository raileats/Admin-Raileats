"use client";
import React, { useEffect, useState } from "react";
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
  stationsOptions?: StationsOption[];
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
  const stationOptions = props.stationsOptions;

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
        // normalize payload - backend might return { ok: true, data } or direct object
        const payload = data?.data ?? data;
        if (mounted) {
          // normalize field names a bit (tolerate different casings)
          const normalized = normalizeRestro(payload);
          setRestro(normalized);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [providedRestroCode, providedRestro, open]);

  function normalizeRestro(raw: any) {
    if (!raw) return raw;
    const low = (k: string) => k?.toLowerCase?.();
    const out: any = { ...raw };
    // small mapping examples for common fields used in UI
    if (raw.RestroCode && !raw.restro_code) out.restro_code = raw.RestroCode;
    if (raw.RestroName && !raw.restro_name) out.restro_name = raw.RestroName;
    if (raw.RestroEmail && !raw.restro_email) out.restro_email = raw.RestroEmail;
    if (raw.RestroPhone && !raw.restro_phone) out.restro_phone = raw.RestroPhone;
    if (raw.OwnerName && !raw.owner_name) out.owner_name = raw.OwnerName;
    if (raw.OwnerEmail && !raw.owner_email) out.owner_email = raw.OwnerEmail;
    if (raw.OwnerPhone && !raw.owner_phone) out.owner_phone = raw.OwnerPhone;
    if (raw.StationCodeWithName && !raw.station_code_with_name) out.station_code_with_name = raw.StationCodeWithName;
    if (raw.State && !raw.state) out.state = raw.State;
    if (raw.District && !raw.district) out.district = raw.District;
    return out;
  }

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      {/* modal container: flex-col so header & footer can be sticky */}
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] md:w-[90vw] max-w-[1400px] h-[90vh] overflow-hidden flex flex-col" role="dialog" aria-modal="true">
        {/* STICKY HEADER inside modal */}
        <div className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-800">
              {providedRestroCode ?? restro?.restro_code ?? restro?.RestroCode ? (
                `${providedRestroCode ?? restro?.restro_code ?? restro?.RestroCode} / ${restro?.restro_name ?? restro?.RestroName ?? ""}`
              ) : (
                "Edit Restro"
              )}
            </div>
            <div className="text-sm text-emerald-700 mt-1">
              {restro?.station_code_with_name ?? restro?.StationCodeWithName ?? ""}
            </div>
          </div>

          <div>
            <button
              aria-label="Close"
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="px-6 py-3 border-b bg-white z-20">
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${activeTab === "basic" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("basic")}>Basic Information</button>
            <button className={`px-3 py-1 rounded ${activeTab === "station" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("station")}>Station Settings</button>
            <button className={`px-3 py-1 rounded ${activeTab === "address" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("address")}>Address & Documents</button>
            <button className={`px-3 py-1 rounded ${activeTab === "contact" ? "bg-amber-100" : "bg-gray-100"}`} onClick={() => setActiveTab("contact")}>Contacts</button>
          </div>
        </div>

        {/* CONTENT - scrollable */}
        <div className="flex-1 overflow-auto px-6 py-6">
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

        {/* STICKY FOOTER ACTIONS */}
        <div className="sticky bottom-0 z-30 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button className="px-4 py-2 rounded border" onClick={() => { setDirty(false); handleClose(); }}>Cancel</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSave} disabled={!dirty || loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
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

// ... the rest of the small tab components (BasicInfoTab, StationSettingsTab, AddressDocsTab, ContactsTab)
// You can keep the previously provided implementations for them unchanged.
// For brevity in this snippet, reuse the same implementations you had earlier.
