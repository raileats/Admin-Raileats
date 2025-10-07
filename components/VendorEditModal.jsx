// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase as supabaseBrowser } from "@/lib/supabaseBrowser";

import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import ContactsTab from "./restro-edit/ContactsTab";
import BankTab from "./restro-edit/BankTab";
import FutureClosedTab from "./restro-edit/FutureClosedTab";
import MenuTab from "./restro-edit/MenuTab";

type Props = {
  restro?: any;
  onClose?: () => void;
  onSave?: (payload: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  saving?: boolean;
  stationsOptions?: { label: string; value: string }[];
  initialTab?: string;
};

const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

// --- Small SVG icons for tabs
const Icon = {
  basic: "🏠",
  settings: "⚙️",
  docs: "📄",
  contacts: "👥",
  bank: "🏦",
  calendar: "📅",
  menu: "🍽️",
};

function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;
function validateEmailString(s: string) {
  if (!s) return false;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) if (!emailRegex.test(p)) return false;
  return true;
}
function validatePhoneString(s: string) {
  if (!s) return false;
  const parts = s.split(",").map((p) => p.replace(/\s+/g, "").trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) if (!tenDigitRegex.test(p)) return false;
  return true;
}

// --- Toggle component
function Toggle({ checked, onChange }: { checked?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 14,
          background: checked ? "#06b6d4" : "#e6e6e6",
          position: "relative",
          transition: "background .15s ease",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#fff",
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left .12s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: "#333" }}>{checked ? "ON" : "OFF"}</span>
    </label>
  );
}

export default function RestroEditModal({
  restro: restroProp,
  onClose,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? TAB_NAMES[0]);
  const [restro, setRestro] = useState<any | undefined>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] = useState(stationsOptions ?? []);
  const [savingInternal, setSavingInternal] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  useEffect(() => {
    if (stations.length) return;
    (async () => {
      const res = await fetch("/api/stations");
      if (!res.ok) return;
      const data = await res.json();
      const rows = data?.rows ?? data?.data ?? [];
      const opts = rows.map((r: any) => ({
        label: `${r.StationName ?? ""} - ${r.State ?? ""}`,
        value: r.StationCode ?? "",
      }));
      setStations(opts);
    })();
  }, []);

  useEffect(() => {
    if (!restro) return;
    setLocal({
      RestroName: safeGet(restro, "RestroName") ?? "",
      RestroCode: safeGet(restro, "RestroCode") ?? "",
      StationName: safeGet(restro, "StationName") ?? "",
      State: safeGet(restro, "State") ?? "",
      RestroEmail: safeGet(restro, "RestroEmail") ?? "",
      OwnerPhone: safeGet(restro, "OwnerPhone") ?? "",
      OwnerName: safeGet(restro, "OwnerName") ?? "",
      ...restro,
    });
  }, [restro]);

  const supabase = supabaseBrowser;
  const saving = parentSaving ?? savingInternal;

  const updateField = useCallback((key: string, value: any) => {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!local.RestroCode) return;
    setSavingInternal(true);
    try {
      const { error } = await supabase.from("RestroMaster").update(local).eq("RestroCode", local.RestroCode);
      if (error) throw error;
      setNotification({ type: "success", text: "Changes saved successfully ✅" });
      setTimeout(() => {
        router.refresh?.();
      }, 800);
    } catch (err: any) {
      setNotification({ type: "error", text: `Save failed: ${err?.message}` });
    } finally {
      setSavingInternal(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const common = { local, updateField, stations, Toggle };

  const renderTab = () => {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return <AddressDocsClient initialData={restro} imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""} />;
      case "Contacts":
        return <ContactsTab {...common} />;
      case "Bank":
        return <BankTab {...common} />;
      case "Future Closed":
        return <FutureClosedTab {...common} />;
      case "Menu":
        return <MenuTab {...common} />;
      default:
        return <div>Unknown Tab</div>;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 1000,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ background: "#fff", width: "98%", height: "98%", borderRadius: 8, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid #eee", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {local.RestroCode ?? ""} / {local.RestroName ?? ""}
            </div>
            <div style={{ fontSize: 13, color: "#0b7285" }}>{local.StationName} - {local.State}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#ef4444",
              border: "none",
              color: "#fff",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #eee", background: "#fafafa", padding: "6px 10px" }}>
          {TAB_NAMES.map((t) => {
            const active = activeTab === t;
            return (
              <div
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: "8px 12px",
                  borderBottom: active ? "3px solid #0ea5e9" : "3px solid transparent",
                  cursor: "pointer",
                  color: active ? "#0ea5e9" : "#333",
                  fontWeight: active ? 700 : 500,
                  borderRadius: 6,
                }}
              >
                <span style={{ marginRight: 6 }}>{Icon[t.toLowerCase().replace(" ", "") as keyof typeof Icon]}</span>
                {t}
              </div>
            );
          })}
        </div>

        {/* Notification */}
        {notification && (
          <div
            style={{
              background: notification.type === "success" ? "#d1fae5" : "#fee2e2",
              color: notification.type === "success" ? "#065f46" : "#991b1b",
              textAlign: "center",
              padding: 8,
              fontWeight: 600,
            }}
          >
            {notification.text}
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>{renderTab()}</div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #eee", padding: 12, textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              background: "#fff",
              border: "1px solid #ccc",
              color: "#333",
              borderRadius: 6,
              padding: "8px 12px",
              marginRight: 8,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#7fcfe9" : "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
