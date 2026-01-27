"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import UI from "@/components/AdminUI";
import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import ContactsTab from "./restro-edit/ContactsTab";
import BankTab from "./restro-edit/BankTab";
import FutureClosedTab from "./restro-edit/FutureClosedTab";
import MenuTab from "./restro-edit/MenuTab";

const {
  AdminForm,
  SubmitButton,
  SecondaryButton,
  Select,
  Toggle,
} = UI;

/* ================== TYPES ================== */
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

/* ================== HELPERS ================== */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function buildStationDisplay(obj: any) {
  const name = (safeGet(obj, "StationName", "station_name") ?? "").trim();
  const code = (safeGet(obj, "StationCode", "station_code") ?? "").trim();
  const state = (safeGet(obj, "State", "state") ?? "").trim();
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}` || "—";
}

/* ================== COMPONENT ================== */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab ?? TAB_NAMES[0]);
  const [restro, setRestro] = useState<any>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] = useState(stationsOptions);
  const [savingInternal, setSavingInternal] = useState(false);

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  useEffect(() => {
    if (!restro) return;
    setLocal({ ...restro });
  }, [restro]);

  const restroCode =
    local?.RestroCode ??
    restro?.RestroCode ??
    restro?.restro_code ??
    "";

  const stationDisplay = buildStationDisplay({ ...restro, ...local });
  const saving = parentSaving ?? savingInternal;

  const updateField = useCallback((k: string, v: any) => {
    setLocal((s: any) => ({ ...s, [k]: v }));
  }, []);

  function doClose() {
    onClose ? onClose() : router.push("/admin/restros");
  }

  /* ================== TAB RENDER ================== */
  const renderTab = () => {
    const common = {
      local,
      updateField,
      stations,
      restroCode,
      Select,
      Toggle,
    };

    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;

      case "Station Settings":
        return <StationSettingsTab {...common} />;

      case "Address & Documents":
        return (
          <AddressDocsClient
            initialData={restro}
            imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}
          />
        );

      case "Contacts":
        return <ContactsTab {...common} />;

      case "Bank":
        return <BankTab {...common} />;

      /* ✅ ONLY restroCode is passed */
      case "Future Closed":
        return <FutureClosedTab restroCode={restroCode} />;

      case "Menu":
        return <MenuTab {...common} />;

      default:
        return null;
    }
  };

  /* ================== UI ================== */
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "98%",
          height: "98%",
          maxWidth: 1700,
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div style={{ borderBottom: "1px solid #eee", padding: 16 }}>
          <b>{restroCode}</b> — {local?.RestroName}
          <div style={{ fontSize: 13, color: "#0b7285" }}>
            {stationDisplay}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, padding: 8, overflowX: "auto" }}>
          {TAB_NAMES.map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom:
                  activeTab === t ? "3px solid #0ea5e9" : "3px solid transparent",
                fontWeight: activeTab === t ? 700 : 500,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <AdminForm>{renderTab()}</AdminForm>
        </div>

        {/* FOOTER */}
        <div
          style={{
            borderTop: "1px solid #eee",
            padding: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <SecondaryButton onClick={doClose}>Cancel</SecondaryButton>
          <SubmitButton disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
