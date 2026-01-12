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

const { AdminForm, SubmitButton, SecondaryButton, Select, Toggle } = UI;

type Props = {
  restro?: any | null;
  onClose?: () => void;
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

/* ---------- helpers ---------- */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/* ---------- component ---------- */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();

  /** 🔥 ADD vs EDIT MODE */
  const isNewOutlet = !restroProp;

  const [activeTab, setActiveTab] = useState<string>(initialTab ?? "Basic Information");
  const [restro, setRestro] = useState<any | null>(restroProp ?? null);
  const [local, setLocal] = useState<any>({});
  const [savingInternal, setSavingInternal] = useState(false);

  /** 🔥 NEW RESTRO = BLANK FORM */
  useEffect(() => {
    if (isNewOutlet) {
      setLocal({
        RestroName: "",
        StationCode: "",
        OwnerName: "",
        OwnerPhone: "",
        WeeklyOff: "SUN",
        OpenTime: "10:00",
        ClosedTime: "23:00",
        OrdersPaymentOptionForCustomer: "BOTH",
        IRCTCOrdersPaymentOptionForCustomer: "BOTH",
      });
    } else if (restroProp) {
      setRestro(restroProp);
      setLocal(restroProp);
    }
  }, [isNewOutlet, restroProp]);

  const saving = parentSaving ?? savingInternal;

  const updateField = useCallback((key: string, value: any) => {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }, []);

  /** 🔥 SAVE HANDLER (ADD + EDIT) */
  async function handleSave() {
    setSavingInternal(true);
    try {
      // 🆕 ADD NEW RESTRO
      if (isNewOutlet) {
        const res = await fetch("/api/restrosmaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(local),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        // 🔁 EDIT MODE AFTER CREATE
        router.push(`/admin/restros/${json.RestroCode}/edit/basic`);
        return;
      }

      // ✏️ EDIT EXISTING
      await fetch("/api/restrosmaster", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });

    } catch (err) {
      console.error(err);
    } finally {
      setSavingInternal(false);
    }
  }

  function doClose() {
    onClose?.();
  }

  const common = {
    local,
    updateField,
    Select,
    Toggle,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return <AddressDocsClient initialData={restro} />;
      case "Contacts":
        return <ContactsTab {...common} />;
      case "Bank":
        return <BankTab {...common} />;
      case "Future Closed":
        return <FutureClosedTab {...common} />;
      case "Menu":
        return <MenuTab {...common} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100 }}>
      <div style={{ background: "#fff", width: "98%", height: "98%", margin: "1%", borderRadius: 8 }}>
        {/* Tabs */}
        <div style={{ display: "flex", padding: 12, borderBottom: "1px solid #eee" }}>
          {TAB_NAMES.map((t) => (
            <button
              key={t}
              disabled={isNewOutlet && t !== "Basic Information"}
              onClick={() => setActiveTab(t)}
              style={{
                marginRight: 8,
                fontWeight: activeTab === t ? 700 : 500,
                opacity: isNewOutlet && t !== "Basic Information" ? 0.4 : 1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>{renderTab()}</div>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <SecondaryButton onClick={doClose}>Cancel</SecondaryButton>
          <SubmitButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
