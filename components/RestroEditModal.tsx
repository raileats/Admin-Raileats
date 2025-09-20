"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  restro?: any;
  onClose?: () => void;
  onSave?: (updatedFields: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  saving?: boolean;
  stationsOptions?: { label: string; value: string }[];
  initialTab?: string;
};

const tabs = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

function getStationDisplayFrom(obj: any) {
  if (!obj) return "—";
  const read = (...keys: string[]) => {
    for (const k of keys) {
      if (!k) continue;
      if (k.includes(".")) {
        const parts = k.split(".");
        let cur: any = obj;
        let ok = true;
        for (const p of parts) {
          if (cur && Object.prototype.hasOwnProperty.call(cur, p) && cur[p] !== undefined && cur[p] !== null) {
            cur = cur[p];
          } else {
            ok = false;
            break;
          }
        }
        if (ok) return cur;
      } else {
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
        const v = (obj as any)[k];
        if (v !== undefined && v !== null) return v;
      }
    }
    return undefined;
  };

  const sName = (read("StationName", "station_name", "station", "station.name", "stationName", "name") ?? "").toString().trim();
  const sCode = (read("StationCode", "station_code", "station.code", "stationCode", "code") ?? "").toString().trim();
  const state = (read("State", "state", "state_name", "StateName", "stateName") ?? "").toString().trim();

  const parts: string[] = [];
  if (sName) parts.push(sName);
  if (sCode) parts.push(`(${sCode})`);
  let left = parts.join(" ");
  if (left && state) left = `${left} - ${state}`;
  else if (!left && state) left = state;
  return left || "—";
}

export default function RestroEditModal({
  restro: restroProp,
  onClose,
  onSave,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? tabs[0]);
  const [savingInternal, setSavingInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restro, setRestro] = useState<any | undefined>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] = useState<{ label: string; value: string }[]>(stationsOptions ?? []);
  const [loadingStations, setLoadingStations] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  // derive code from path if restro missing
  function getCodeFromPath(): string | null {
    try {
      const p = typeof window !== "undefined" ? window.location.pathname : "";
      const m = p.match(/\/restros\/([^\/]+)\/edit/);
      if (m && m[1]) return decodeURIComponent(m[1]);
      return null;
    } catch {
      return null;
    }
  }

  // fetch restro if not provided
  useEffect(() => {
    async function fetchRestro(code: string) {
      try {
        const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Fetch failed (${res.status})`);
        }
        const json = await res.json().catch(() => null);
        const row = json?.row ?? json ?? null;
        if (row) setRestro(row);
        else console.warn("RestroEditModal GET returned no row for", code, json);
      } catch (err: any) {
        console.error("RestroEditModal fetch error:", err);
        setError("Failed to load restro data");
      }
    }

    if (!restro) {
      const code = getCodeFromPath();
      if (code) fetchRestro(code);
      else console.warn("No restro prop and cannot parse code from path");
    }
  }, [restro]);

  // fetch stations list if not provided
  useEffect(() => {
    if (stations && stations.length) return; // already have
    async function loadStations() {
      setLoadingStations(true);
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) {
          // Endpoint might not exist, fall back silently
          console.warn("/api/stations not available:", res.status);
          setLoadingStations(false);
          return;
        }
        const json = await res.json();
        const rows = json?.rows ?? json?.data ?? json ?? [];
        const opts = (rows || []).map((r: any) => {
          const label = `${(r.StationName ?? r.station_name ?? r.name ?? "").toString().trim()} ${(r.StationCode || r.station_code) ? `(${r.StationCode ?? r.station_code})` : ""}${r.State ? ` - ${r.State}` : ""}`.trim();
          return { label, value: (r.StationCode ?? r.station_code ?? r.StationCode ?? "").toString() };
        });
        if (opts.length) setStations(opts);
      } catch (err) {
        console.warn("Failed to load stations list:", err);
      } finally {
        setLoadingStations(false);
      }
    }
    loadStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // robust getter for many column names
  const get = (obj: any, ...keys: string[]) => {
    for (const k of keys) {
      if (!obj) continue;
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };

  // When restro updates populate local
  useEffect(() => {
    if (!restro) return;
    setLocal({
      RestroName: get(restro, "RestroName", "restro_name", "name") ?? "",
      RestroCode: get(restro, "RestroCode", "restro_code", "code", "RestroId", "restro_id") ?? "",
      StationCode: get(restro, "StationCode", "station_code", "Station_Code", "stationCode") ?? "",
      StationName: get(restro, "StationName", "station_name", "station") ?? "",
      State: get(restro, "State", "state", "state_name", "StateName") ?? "",
      StationCategory: get(restro, "StationCategory", "station_category", "stationType", "Station_Type", "Category", "category") ?? "",

      WeeklyOff: get(restro, "WeeklyOff", "weekly_off") ?? "SUN",
      OpenTime: get(restro, "OpenTime", "open_time") ?? "10:00",
      ClosedTime: get(restro, "ClosedTime", "closed_time") ?? "23:00",
      MinimumOrderValue: Number(get(restro, "MinimumOrderValue", "minimum_order_value", "min_order_value") ?? 0),
      CutOffTime: Number(get(restro, "CutOffTime", "cut_off_time") ?? 0),

      RaileatsDeliveryCharge: Number(get(restro, "RaileatsDeliveryCharge", "raileats_delivery_charge") ?? 0),
      RaileatsDeliveryChargeGSTRate: Number(get(restro, "RaileatsDeliveryChargeGSTRate", "raileats_delivery_charge_gst_rate") ?? 0),
      RaileatsDeliveryChargeGST: Number(get(restro, "RaileatsDeliveryChargeGST", "raileats_delivery_charge_gst") ?? 0),
      RaileatsDeliveryChargeTotalInclGST:
        Number(get(restro, "RaileatsDeliveryChargeTotalInclGST", "raileats_delivery_charge_total_incl_gst") ?? 0),

      OrdersPaymentOptionForCustomer: get(restro, "OrdersPaymentOptionForCustomer", "orders_payment_option_for_customer") ?? "BOTH",
      IRCTCOrdersPaymentOptionForCustomer: get(restro, "IRCTCOrdersPaymentOptionForCustomer", "irctc_orders_payment_option") ?? "BOTH",
      RestroTypeOfDelivery: get(restro, "RestroTypeOfDelivery", "restro_type_of_delivery") ?? "RAILEATS",

      IRCTC: get(restro, "IRCTC", "irctc") === 1 || get(restro, "IRCTC", "irctc") === "1" || get(restro, "IRCTC", "irctc") === true,
      Raileats: get(restro, "Raileats", "raileats") === 1 || get(restro, "Raileats", "raileats") === "1" || get(restro, "Raileats", "raileats") === true,
      IsIrctcApproved:
        get(restro, "IsIrctcApproved", "is_irctc_approved", "isIrctcApproved") === 1 ||
        get(restro, "IsIrctcApproved", "is_irctc_approved", "isIrctcApproved") === "1" ||
        get(restro, "IsIrctcApproved", "is_irctc_approved", "isIrctcApproved") === true,

      OwnerName: get(restro, "OwnerName", "owner_name") ?? "",
      OwnerPhone: get(restro, "OwnerPhone", "owner_phone") ?? "",
      FSSAINumber: get(restro, "FSSAINumber", "fssai_number") ?? "",
      FSSAIExpiryDate: get(restro, "FSSAIExpiryDate", "fssai_expiry_date") ?? "",

      RestroDisplayPhoto: get(restro, "RestroDisplayPhoto", "restro_display_photo") ?? "",
      RestroRating: get(restro, "RestroRating", "restro_rating") ?? "",
      BrandName: get(restro, "BrandName", "brand_name") ?? "",
      RestroEmail: get(restro, "RestroEmail", "restro_email") ?? "",
      RestroPhone: get(restro, "RestroPhone", "restro_phone") ?? "",

      ...restro,
    });
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  function updateField(key: string, value: any) {
    setLocal((s: any) => {
      const next = { ...s, [key]: value };

      // Auto-recompute GST and total if charge or rate changed
      if (key === "RaileatsDeliveryCharge" || key === "RaileatsDeliveryChargeGSTRate") {
        const charge = Number(next.RaileatsDeliveryCharge) || 0;
        const rate = Number(next.RaileatsDeliveryChargeGSTRate) || 0;
        const gstAbs = Math.round((charge * rate) / 100 * 100) / 100; // two decimals
        next.RaileatsDeliveryChargeGST = gstAbs;
        next.RaileatsDeliveryChargeTotalInclGST = Math.round((charge + gstAbs) * 100) / 100;
      }

      // If someone edits GST absolute directly, recompute total
      if (key === "RaileatsDeliveryChargeGST") {
        const charge = Number(next.RaileatsDeliveryCharge) || 0;
        const gstAbs = Number(next.RaileatsDeliveryChargeGST) || 0;
        next.RaileatsDeliveryChargeTotalInclGST = Math.round((charge + gstAbs) * 100) / 100;
        // Also try to set rate (approx)
        const rate = charge ? Math.round((gstAbs / charge) * 10000) / 100 : 0;
        next.RaileatsDeliveryChargeGSTRate = rate;
      }

      return next;
    });
    setError(null);
  }

  async function defaultPatch(payload: any) {
    try {
      const code =
        restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? restro?.code ?? local?.RestroCode;
      if (!code) throw new Error("Missing RestroCode for update");
      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Update failed (${res.status})`);
      }
      const json = await res.json().catch(() => null);
      return { ok: true, row: json?.row ?? json ?? null };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async function handleSave() {
    setError(null);
    const payload: any = {
      RestroName: local.RestroName ?? "",
      StationCode: local.StationCode ?? null,
      StationName: local.StationName ?? null,
      State: local.State ?? null,
      StationCategory: local.StationCategory ?? null,
      WeeklyOff: local.WeeklyOff ?? null,
      OpenTime: local.OpenTime ?? null,
      ClosedTime: local.ClosedTime ?? null,
      MinimumOrderValue: Number(local.MinimumOrderValue) || 0,
      CutOffTime: Number(local.CutOffTime) || 0,
      RaileatsDeliveryCharge: Number(local.RaileatsDeliveryCharge) || 0,
      RaileatsDeliveryChargeGSTRate: Number(local.RaileatsDeliveryChargeGSTRate) || 0,
      RaileatsDeliveryChargeGST: Number(local.RaileatsDeliveryChargeGST) || 0,
      RaileatsDeliveryChargeTotalInclGST: Number(local.RaileatsDeliveryChargeTotalInclGST) || 0,
      OrdersPaymentOptionForCustomer: local.OrdersPaymentOptionForCustomer ?? null,
      IRCTCOrdersPaymentOptionForCustomer: local.IRCTCOrdersPaymentOptionForCustomer ?? null,
      RestroTypeOfDelivery: local.RestroTypeOfDelivery ?? null,
      IRCTC: local.IRCTC ? 1 : 0,
      Raileats: local.Raileats ? 1 : 0,
      IsIrctcApproved: local.IsIrctcApproved ? 1 : 0,
    };

    try {
      if (onSave) {
        if (parentSaving === undefined) setSavingInternal(true);
        const result = await onSave(payload);
        if (!result || !result.ok) throw new Error(result?.error ?? "Save failed");
        if (result.row) setRestro(result.row);
        doClose();
      } else {
        setSavingInternal(true);
        const result = await defaultPatch(payload);
        if (!result.ok) throw new Error(result.error ?? "Save failed");
        if (result.row) setRestro(result.row);
        doClose();
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err?.message ?? String(err));
    } finally {
      if (parentSaving === undefined) setSavingInternal(false);
    }
  }

  function doClose() {
    if (onClose) {
      try {
        onClose();
      } catch {
        router.push("/admin/restros");
      }
    } else {
      router.push("/admin/restros");
    }
  }

  const stationDisplay = getStationDisplayFrom({ ...restro, ...local });

  // choose select options: prop or fetched or fallback single
  const stationSelectOptions =
    (stations && stations.length > 0)
      ? stations
      : [{ label: stationDisplay, value: local.StationCode ?? restro?.StationCode ?? "" }];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
        padding: 16,
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "98%",
          height: "98%",
          maxWidth: "1700px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{ flex: "0 0 auto", zIndex: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              borderBottom: "1px solid #e9e9e9",
              background: "#fff",
              position: "sticky",
              top: 0,
              zIndex: 1200,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>
              <span>
                {String(local.RestroCode ?? restro?.RestroCode ?? "")}
                {local.RestroName || restro?.RestroName ? " / " : ""} {local.RestroName ?? restro?.RestroName ?? ""}
              </span>
              <br />
              <span style={{ fontWeight: 600, fontSize: 13, color: "#0b7285" }}>{stationDisplay}</span>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <a
                href={`/admin/restros/edit/${encodeURIComponent(String(local.RestroCode ?? restro?.RestroCode ?? ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0ea5e9", textDecoration: "underline", fontSize: 14 }}
              >
                Open Outlet Page
              </a>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  doClose();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 8,
                  lineHeight: 1,
                  minWidth: 44,
                }}
                aria-label="Close"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #eee", background: "#fafafa", paddingLeft: 6, paddingRight: 6 }}>
            {tabs.map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: activeTab === tab ? "3px solid #0ea5e9" : "3px solid transparent",
                  fontWeight: activeTab === tab ? 600 : 500,
                  color: activeTab === tab ? "#0ea5e9" : "#333",
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Save toolbar */}
          <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8, background: "#fff" }}>
            {error && <div style={{ color: "red", marginRight: "auto" }}>{error}</div>}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? "#7fcfe9" : "#0ea5e9",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {/* Basic Information */}
          {activeTab === "Basic Information" && (
            <div>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Basic Information</h3>
              <div className="compact-grid">
                <div className="field">
                  <label>Station</label>
                  <div className="readonly">{stationDisplay}</div>
                </div>

                <div className="field">
                  <label>Restro Code</label>
                  <div className="readonly">{local.RestroCode ?? "—"}</div>
                </div>

                <div className="field">
                  <label>Restro Name</label>
                  <input value={local.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
                </div>

                {/* rest of Basic Information fields same as before */}
                <div className="field">
                  <label>Brand Name</label>
                  <input value={local.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Status</label>
                  <select value={local.Raileats ? 1 : 0} onChange={(e) => updateField("Raileats", Number(e.target.value) === 1)}>
                    <option value={1}>On</option>
                    <option value={0}>Off</option>
                  </select>
                </div>

                <div className="field">
                  <label>Is IRCTC Approved</label>
                  <select value={local.IsIrctcApproved ? "1" : "0"} onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>

                <div className="field">
                  <label>Restro Rating</label>
                  <input type="number" step="0.1" value={local.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} />
                </div>

                <div className="field">
                  <label>Restro Display Photo (path)</label>
                  <input value={local.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} />
                </div>

                <div className="field">
                  <label>Display Preview</label>
                  {local.RestroDisplayPhoto ? (
                    <img
                      src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto}
                      alt="display"
                      className="preview"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <div className="readonly">No image</div>
                  )}
                </div>

                {/* other fields omitted for brevity but same as before */}
              </div>
            </div>
          )}

          {/* Station Settings (NEW improved layout & fields) */}
          {activeTab === "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Station Settings</h3>

              <div className="compact-grid">
                <div className="field">
                  <label>Station (Code with Name)</label>
                  <select
                    value={local.StationCode ?? ""}
                    onChange={(e) => {
                      const selected = stations.find((s) => s.value === e.target.value);
                      updateField("StationCode", e.target.value);
                      if (selected) {
                        // try to parse label (contains name/code/state)
                        updateField("StationName", selected.label.split("(")[0].trim());
                      }
                    }}
                  >
                    <option value="">Select station</option>
                    {stationSelectOptions.map((opt) => (
                      <option key={opt.value || opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Station Category</label>
                  <input value={local.StationCategory ?? ""} onChange={(e) => updateField("StationCategory", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge</label>
                  <input
                    type="number"
                    value={Number(local.RaileatsDeliveryCharge ?? 0)}
                    onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))}
                  />
                </div>

                <div className="field">
                  <label>Weekly Off</label>
                  <select value={local.WeeklyOff ?? "SUN"} onChange={(e) => updateField("WeeklyOff", e.target.value)}>
                    <option value="SUN">SUN</option>
                    <option value="MON">MON</option>
                    <option value="TUE">TUE</option>
                    <option value="WED">WED</option>
                    <option value="THU">THU</option>
                    <option value="FRI">FRI</option>
                    <option value="SAT">SAT</option>
                  </select>
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={Number(local.RaileatsDeliveryChargeGSTRate ?? 0)}
                    onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))}
                  />
                </div>

                <div className="field">
                  <label>Open Time</label>
                  <input type="time" value={local.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} />
                </div>

                <div className="field">
                  <label>Closed Time</label>
                  <input type="time" value={local.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge GST (absolute)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={Number(local.RaileatsDeliveryChargeGST ?? 0)}
                    onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))}
                  />
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge Total Incl GST</label>
                  <input
                    type="number"
                    step="0.01"
                    value={Number(local.RaileatsDeliveryChargeTotalInclGST ?? 0)}
                    onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))}
                  />
                </div>

                <div className="field">
                  <label>Minimum Order Value</label>
                  <input type="number" value={Number(local.MinimumOrderValue ?? 0)} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))} />
                </div>

                <div className="field">
                  <label>Cut Off Time (mins)</label>
                  <input type="number" value={Number(local.CutOffTime ?? 0)} onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))} />
                </div>

                <div className="field">
                  <label>Raileats Orders Payment Option for Customer</label>
                  <select value={local.OrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("OrdersPaymentOptionForCustomer", e.target.value)}>
                    <option value="BOTH">Both</option>
                    <option value="PREPAID">Prepaid Only</option>
                    <option value="COD">COD Only</option>
                  </select>
                </div>

                <div className="field">
                  <label>IRCTC Orders Payment Option for Customer</label>
                  <select value={local.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionForCustomer", e.target.value)}>
                    <option value="BOTH">Both</option>
                    <option value="PREPAID">Prepaid Only</option>
                    <option value="COD">COD Only</option>
                  </select>
                </div>

                <div className="field">
                  <label>Restro Type of Delivery (Vendor / Raileats)</label>
                  <select value={local.RestroTypeOfDelivery ?? "RAILEATS"} onChange={(e) => updateField("RestroTypeOfDelivery", e.target.value)}>
                    <option value="RAILEATS">Raileats Delivery</option>
                    <option value="VENDOR">Vendor Self</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder content for other tabs */}
          {activeTab !== "Basic Information" && activeTab !== "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0 }}>{activeTab}</h3>
              <p>Placeholder area for <b>{activeTab}</b> content — implement forms/fields here as needed.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          max-width: 1200px;
          margin: 8px auto;
        }
        .field label {
          display: block;
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .field input, .field select {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }
        .readonly {
          padding: 8px 10px;
          border-radius: 6px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          font-size: 13px;
        }
        .preview {
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        @media (max-width: 1100px) {
          .compact-grid { grid-template-columns: repeat(2, 1fr); max-width: 900px; }
        }
        @media (max-width: 720px) {
          .compact-grid { grid-template-columns: 1fr; max-width: 680px; }
        }
      `}</style>
    </div>
  );
}
