// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
  onSave?: (updatedFields: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  saving?: boolean;
  /**
   * Optional stations options array: [{ label: "NIZAMABAD (NZB) - Telangana", value: "NZB" }, ...]
   * If provided, the Station select will use this list. Otherwise station will show read-only display.
   */
  stationsOptions?: { label: string; value: string }[];
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

export default function RestroEditModal({ restro, onClose, onSave, saving: parentSaving, stationsOptions = [] }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [savingInternal, setSavingInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local editable copy
  const [local, setLocal] = useState<any>({});
  useEffect(() => {
    setLocal({
      // basic
      RestroName: restro?.RestroName ?? restro?.restro_name ?? "",
      RestroCode: restro?.RestroCode ?? restro?.restro_code ?? "",
      StationCode: restro?.StationCode ?? restro?.station_code ?? "",
      StationName: restro?.StationName ?? restro?.station_name ?? "",
      // station settings (from your CSV/DB)
      StationCategory: restro?.StationCategory ?? restro?.station_category ?? "A",
      WeeklyOff: restro?.WeeklyOff ?? restro?.weekly_off ?? "SUN",
      OpenTime: restro?.OpenTime ?? restro?.open_time ?? "10:00",
      ClosedTime: restro?.ClosedTime ?? restro?.closed_time ?? "23:00",
      MinimumOrderValue: restro?.MinimumOrderValue ?? restro?.minimum_order_value ?? 0,
      CutOffTime: restro?.CutOffTime ?? restro?.cut_off_time ?? 0,
      RaileatsDeliveryCharge: restro?.RaileatsDeliveryCharge ?? restro?.raileats_delivery_charge ?? 0,
      RaileatsDeliveryChargeGSTRate: restro?.RaileatsDeliveryChargeGSTRate ?? restro?.raileats_delivery_charge_gst_rate ?? 0,
      RaileatsDeliveryChargeGST: restro?.RaileatsDeliveryChargeGST ?? restro?.raileats_delivery_charge_gst ?? 0,
      RaileatsDeliveryChargeTotalInclGST: restro?.RaileatsDeliveryChargeTotalInclGST ?? restro?.raileats_delivery_charge_total_incl_gst ?? 0,
      OrdersPaymentOptionForCustomer: restro?.OrdersPaymentOptionForCustomer ?? restro?.orders_payment_option_for_customer ?? "BOTH", // BOTH / PREPAID / COD
      IRCTCOrdersPaymentOptionForCustomer: restro?.IRCTCOrdersPaymentOptionForCustomer ?? restro?.irctc_orders_payment_option ?? "BOTH",
      RestroTypeOfDelivery: restro?.RestroTypeOfDelivery ?? restro?.restro_type_of_delivery ?? "RAILEATS", // RAILEATS / VENDOR
      // flags
      IRCTC: restro?.IRCTC === 1 || restro?.IRCTC === "1" || restro?.IRCTC === true,
      Raileats: restro?.Raileats === 1 || restro?.Raileats === "1" || restro?.Raileats === true,
      IsIrctcApproved:
        restro?.IsIrctcApproved === 1 || restro?.IsIrctcApproved === "1" || restro?.IsIrctcApproved === true,
      // fallback image, owner etc.
      OwnerName: restro?.OwnerName ?? restro?.owner_name ?? "",
      OwnerPhone: restro?.OwnerPhone ?? restro?.owner_phone ?? "",
      FSSAINumber: restro?.FSSAINumber ?? restro?.fssai_number ?? "",
      FSSAIExpiryDate: restro?.FSSAIExpiryDate ?? restro?.fssai_expiry_date ?? "",
      ...restro,
    });
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  async function defaultPatch(payload: any) {
    try {
      const code = restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? restro?.code;
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
      const updated = json?.row ?? json ?? null;
      return { ok: true, row: updated };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async function handleSave() {
    setError(null);
    // include station settings fields in payload
    const payload: any = {
      // keep basic fields minimal (parent may send others)
      RestroName: local.RestroName ?? "",
      StationCode: local.StationCode ?? restro?.StationCode ?? "",
      StationName: local.StationName ?? restro?.StationName ?? "",
      // station settings fields
      StationCategory: local.StationCategory ?? null,
      WeeklyOff: local.WeeklyOff ?? null,
      OpenTime: local.OpenTime ?? null,
      ClosedTime: local.ClosedTime ?? null,
      MinimumOrderValue: local.MinimumOrderValue ?? null,
      CutOffTime: local.CutOffTime ?? null,
      RaileatsDeliveryCharge: local.RaileatsDeliveryCharge ?? null,
      RaileatsDeliveryChargeGSTRate: local.RaileatsDeliveryChargeGSTRate ?? null,
      RaileatsDeliveryChargeGST: local.RaileatsDeliveryChargeGST ?? null,
      RaileatsDeliveryChargeTotalInclGST: local.RaileatsDeliveryChargeTotalInclGST ?? null,
      OrdersPaymentOptionForCustomer: local.OrdersPaymentOptionForCustomer ?? null,
      IRCTCOrdersPaymentOptionForCustomer: local.IRCTCOrdersPaymentOptionForCustomer ?? null,
      RestroTypeOfDelivery: local.RestroTypeOfDelivery ?? null,
      // flags
      IRCTC: local.IRCTC ? 1 : 0,
      Raileats: local.Raileats ? 1 : 0,
      IsIrctcApproved: local.IsIrctcApproved ? 1 : 0,
    };

    try {
      if (onSave) {
        if (parentSaving === undefined) setSavingInternal(true);
        const result = await onSave(payload);
        if (!result || !result.ok) {
          throw new Error(result?.error ?? "Save failed");
        }
        onClose();
      } else {
        setSavingInternal(true);
        const result = await defaultPatch(payload);
        if (!result.ok) {
          throw new Error(result.error ?? "Save failed");
        }
        onClose();
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err?.message ?? String(err));
    } finally {
      if (parentSaving === undefined) setSavingInternal(false);
    }
  }

  // helper to create station display string (NIZAMABAD (NZB) - Telangana)
  const getStationDisplay = () => {
    if (typeof restro?.StationDisplay === "string" && restro.StationDisplay.trim()) return restro.StationDisplay.trim();
    const sName = (restro?.StationName ?? local.StationName ?? "").toString().trim();
    const sCode = (restro?.StationCode ?? local.StationCode ?? "").toString().trim();
    const state = (restro?.State ?? local.State ?? "").toString().trim();
    const leftParts: string[] = [];
    if (sName) leftParts.push(sName);
    if (sCode) leftParts.push(`(${sCode})`);
    const left = leftParts.join(" ");
    if (left && state) return `${left} - ${state}`;
    if (left) return left;
    if (state) return state;
    return "—";
  };
  const stationDisplay = getStationDisplay();

  // station select options: use provided stationsOptions if available, otherwise show display as readonly
  const stationSelectOptions = stationsOptions && stationsOptions.length ? stationsOptions : [{ label: stationDisplay, value: local.StationCode ?? restro?.StationCode ?? "" }];

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
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "92%",
          height: "92%",
          maxWidth: "1700px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #e9e9e9" }}>
          <div style={{ fontWeight: 600 }}>
            {String(local.RestroCode ?? restro?.RestroCode ?? "")} / {local.RestroName ?? restro?.RestroName} / {stationDisplay}
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

            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", padding: 6 }} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #eee", background: "#fafafa" }}>
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

        {/* Toolbar */}
        <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {error && <div style={{ color: "red", marginRight: "auto" }}>{error}</div>}
          <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {activeTab === "Basic Information" && (
            <div>
              {/* keep Basic Information compact layout (unchanged) */}
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
                  {local.RestroDisplayPhoto ? <img src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <div className="readonly">No image</div>}
                </div>

                <div className="field">
                  <label>Owner Name</label>
                  <input value={local.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
                </div>

                <div className="field">
                  <label>Owner Email</label>
                  <input value={local.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} />
                </div>

                <div className="field">
                  <label>Owner Phone</label>
                  <input value={local.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} />
                </div>

                <div className="field">
                  <label>Restro Email</label>
                  <input value={local.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} />
                </div>

                <div className="field">
                  <label>Restro Phone</label>
                  <input value={local.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} />
                </div>

                <div className="field">
                  <label>FSSAI Number</label>
                  <input value={local.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} />
                </div>

                <div className="field">
                  <label>FSSAI Expiry Date</label>
                  <input type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Station Settings</h3>

              <div className="compact-grid">
                {/* Station Code with Name (dropdown from stationsOptions OR readonly) */}
                <div className="field">
                  <label>Station Code with Name</label>
                  {stationsOptions && stationsOptions.length ? (
                    <select
                      value={local.StationCode ?? ""}
                      onChange={(e) => {
                        const selected = stationsOptions.find((s) => String(s.value) === String(e.target.value));
                        if (selected) {
                          // attempt to parse label into pieces if label contains name/code/state
                          updateField("StationCode", selected.value);
                          // don't overwrite StationName/State if not present
                          // if label looks like "NAME (CODE) - STATE", parse it:
                          const m = selected.label.match(/^(.+?)\s*\(([^)]+)\)\s*(?:-\s*(.+))?$/);
                          if (m) {
                            updateField("StationName", m[1].trim());
                            if (m[3]) updateField("State", m[3].trim());
                          }
                        } else {
                          updateField("StationCode", e.target.value);
                        }
                      }}
                    >
                      {stationsOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="readonly">{stationDisplay}</div>
                  )}
                </div>

                <div className="field">
                  <label>Station Category</label>
                  <input value={local.StationCategory ?? ""} onChange={(e) => updateField("StationCategory", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge</label>
                  <input type="number" value={local.RaileatsDeliveryCharge ?? 0} onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value))} />
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
                  <input type="number" value={local.RaileatsDeliveryChargeGSTRate ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value))} />
                </div>

                <div className="field">
                  <label>Open Time</label>
                  <input type="time" value={local.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge GST (absolute)</label>
                  <input type="number" value={local.RaileatsDeliveryChargeGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value))} />
                </div>

                <div className="field">
                  <label>Closed Time</label>
                  <input type="time" value={local.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Customer Delivery Charge Total Incl GST</label>
                  <input type="number" value={local.RaileatsDeliveryChargeTotalInclGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value))} />
                </div>

                <div className="field">
                  <label>Minimum Order Value</label>
                  <input type="number" value={local.MinimumOrderValue ?? 0} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value))} />
                </div>

                <div className="field">
                  <label>Cut Off Time (mins)</label>
                  <input type="number" value={local.CutOffTime ?? 0} onChange={(e) => updateField("CutOffTime", Number(e.target.value))} />
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
          max-width: 1100px;
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
          .compact-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          .compact-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
