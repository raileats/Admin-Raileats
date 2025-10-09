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
        // API might return { ok:true, data: {...} } or the row directly — try both
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

  if (!open) return null;

  // header station display values (safely)
  const headerTitle = `Edit Restro — ${providedRestroCode ?? restro?.restro_code ?? restro?.RestroCode ?? ""}`;
  const headerMain = restro?.restro_name ?? restro?.RestroName ?? "";
  const headerSub = restro?.station_code_with_name ?? restro?.StationCodeWithName ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal shell: vertical flex so header (sticky), content (scroll), footer (sticky) */}
      <div
        className="bg-white rounded-lg shadow-2xl w-[95vw] md:w-[90vw] max-w-[1400px] h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* STICKY HEADER */}
        <div className="sticky top-0 bg-white z-20 border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{headerTitle}</h2>
            {/* center-left small tabs indicator (optional) */}
            <div className="hidden md:block text-sm text-gray-600">{/* keep for spacing */}</div>
          </div>

          {/* Center area: station title (visible on larger screens) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="text-center">
              <div className="font-semibold text-sm">{headerMain}</div>
              {headerSub && <div className="text-xs text-teal-600">{headerSub}</div>}
            </div>
          </div>

          {/* RIGHT: single close (red X) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              aria-label="Close"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* CONTENT (scrollable) */}
        <div className="flex-1 overflow-auto p-6">
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

        {/* STICKY FOOTER (always visible) */}
        <div className="sticky bottom-0 bg-white z-20 border-t px-6 py-3 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded border bg-white"
            onClick={() => {
              // discard changes (reset to providedRestro or fetched restro)
              setRestro(providedRestro ?? restro ?? null);
              setDirty(false);
            }}
            disabled={!dirty && !loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || loading}
            className={`px-4 py-2 rounded text-white ${dirty && !loading ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- subcomponents unchanged (kept same, minor spacing) ----------------- */

function TextRow({ label, value, onChange, placeholder, readOnly = false }: any) {
  return (
    <div className="grid grid-cols-5 gap-3 items-center py-2">
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

/* The small tab components (BasicInfoTab, StationSettingsTab, AddressDocsTab, ContactsTab)
   keep the same implementation as before (you can copy them as in your existing file).
   For brevity they are omitted here — but in your file keep them as in previous version. */

