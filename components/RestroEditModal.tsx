"use client";

import React, { useEffect, useState, useCallback } from "react";
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

export default function RestroEditModal({
  restro: restroProp,
  onClose,
  saving: parentSaving,
  initialTab,
}: Props) {
  const router = useRouter();

  /** 🆕 ADD vs ✏️ EDIT */
  const isNewOutlet = !restroProp;

  const [activeTab, setActiveTab] = useState(initialTab ?? "Basic Information");
  const [restro, setRestro] = useState<any | null>(restroProp ?? null);
  const [local, setLocal] = useState<any>({});
  const [savingInternal, setSavingInternal] = useState(false);

  /** 🆕 NEW RESTRO → BLANK FORM */
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
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  /** 💾 SAVE (ADD + EDIT) */
  async function handleSave() {
    setSavingInternal(true);
    try {
      /** 🆕 CREATE */
      if (isNewOutlet) {
        const res = await fetch("/api/restrosmaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(local),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Create failed");

        // 🔁 Redirect to EDIT MODE
        router.push(`/admin/restros/${json.RestroCode}/edit/basic`);
        return;
      }

      /** ✏️ UPDATE */
      await fetch("/api/restrosmaster", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...local,
          RestroCode: local.RestroCode ?? restro?.RestroCode,
        }),
      });
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed. Check console.");
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
        return restro ? <AddressDocsClient initialData={restro} /> : null;
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
      <div style={{ background: "#fff", width: "98%", height: "98%", margin: "1%", borderRadius: 8, display: "flex", flexDirection: "column" }}>
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
        <div style={{ padding: 20, flex: 1, overflow: "auto" }}>
          <AdminForm>{renderTab()}</AdminForm>
        </div>

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
