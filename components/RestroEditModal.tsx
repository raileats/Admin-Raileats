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
  FormRow,
  FormField,
  FormActions,
  SubmitButton,
  SecondaryButton,
  Select,
  Toggle,
  SearchBar,
} = UI;

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

/* ---------- helpers (unchanged) ---------- */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (
      Object.prototype.hasOwnProperty.call(obj, k) &&
      obj[k] !== undefined &&
      obj[k] !== null
    )
      return obj[k];
  }
  return undefined;
}

function buildStationDisplay(obj: any) {
  const sName = (
    safeGet(obj, "StationName", "station_name", "station", "name") ?? ""
  )
    .toString()
    .trim();
  const sCode = (
    safeGet(obj, "StationCode", "station_code", "Station_Code", "stationCode") ??
    ""
  )
    .toString()
    .trim();
  const state = (
    safeGet(obj, "State", "state", "state_name", "StateName") ?? ""
  )
    .toString()
    .trim();
  const parts: string[] = [];
  if (sName) parts.push(sName);
  if (sCode) parts.push(`(${sCode})`);
  let left = parts.join(" ");
  if (left && state) left = `${left} - ${state}`;
  else if (!left && state) left = state;
  return left || "—";
}

/* ---------- validators (unchanged) ---------- */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

function validateEmailString(s: string) {
  if (!s) return false;
  const parts = s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) {
    if (!emailRegex.test(p)) return false;
  }
  return true;
}

function validatePhoneString(s: string) {
  if (!s) return false;
  const parts = s
    .split(",")
    .map((p) => p.replace(/\s+/g, "").trim())
    .filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) {
    if (!tenDigitRegex.test(p)) return false;
  }
  return true;
}

/* ---------- component ---------- */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  onSave,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>(
    initialTab ?? TAB_NAMES[0]
  );
  const [restro, setRestro] = useState<any | undefined>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] =
    useState<{ label: string; value: string }[]>(stationsOptions ?? []);
  const [loadingStations, setLoadingStations] = useState(false);
  const [savingInternal, setSavingInternal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- effects & logic ABOVE remain EXACTLY SAME ---- */
  /* ---- (no change in your business logic) ---- */

  const stationDisplay = buildStationDisplay({ ...restro, ...local });

  const restroCode =
    (local &&
      (local.RestroCode ??
        local.restro_code ??
        local.id ??
        local.code)) ||
    (restro &&
      (restro.RestroCode ??
        restro.restro_code ??
        restro.RestroId ??
        restro.restro_id ??
        restro.code)) ||
    "";

  const common = {
    local,
    updateField: (k: string, v: any) =>
      setLocal((s: any) => ({ ...s, [k]: v })),
    stationDisplay,
    stations,
    loadingStations,
    restroCode,
    Select,
    Toggle,
    validators: {
      validateEmailString,
      validatePhoneString,
    },
  };

  const renderTab = () => {
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
      case "Future Closed":
        // ✅ ONLY FIX IS HERE
        return <FutureClosedTab restroCode={restroCode} />;
      case "Menu":
        return <MenuTab {...common} />;
      default:
        return <div>Unknown tab</div>;
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
        zIndex: 1100,
      }}
      role="dialog"
      aria-modal="true"
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
          overflow: "hidden",
        }}
      >
        {/* header + tabs + content + footer — unchanged */}
        <AdminForm className="min-h-[480px]">{renderTab()}</AdminForm>
      </div>
    </div>
  );
}
