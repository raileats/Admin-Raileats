"use client";

import React, { useEffect, useState } from "react";
import BasicInformation from "@/components/restro-edit/BasicInformation";
import AddressDocsClient from "@/components/restro-edit/AddressDocsClient";
import ContactsTab from "@/components/restro-edit/ContactsTab";
import BankTab from "@/components/restro-edit/BankTab";
import FutureClosedTab from "@/components/restro-edit/FutureClosedTab";
import MenuTab from "@/components/restro-edit/MenuTab";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function RestroEditModal({
  restro,
  onClose,
  onSave,
}: {
  restro: any;
  onClose: () => void;
  onSave: (updated: any) => Promise<void>;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Basic Information");
  const [local, setLocal] = useState(restro || {});
  const [loadingStations, setLoadingStations] = useState(false);
  const [stations, setStations] = useState<{ label: string; value: string }[]>(
    []
  );
  const [stationDisplay, setStationDisplay] = useState("");

  // simulate station data (your existing logic can replace this)
  useEffect(() => {
    setLoadingStations(true);
    setTimeout(() => {
      setStations([{ label: "NDLS", value: "NDLS" }]);
      setStationDisplay(local?.StationName || "");
      setLoadingStations(false);
    }, 500);
  }, [local]);

  const updateField = (key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await onSave(local);
      toast({ title: "Restaurant updated successfully!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to save restaurant", description: err.message });
    }
  };

  const common = {
    local,
    updateField,
    stationDisplay,
    stations,
    loadingStations,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformation {...common} />;

      case "Address & Documents":
        return <AddressDocsClient initialData={restro} />;

      case "Contacts": {
        // ✅ FIX: added restroCode (previously missing)
        const computedRestroCode = String(
          restro?.RestroCode ??
            restro?.code ??
            restro?.id ??
            local?.RestroCode ??
            local?.VendorCode ??
            local?.id ??
            ""
        );

        return <ContactsTab restroCode={computedRestroCode} {...common} />;
      }

      case "Bank":
        return <BankTab {...common} />;

      case "Future Closed":
        return <FutureClosedTab {...common} />;

      case "Menu":
        return <MenuTab {...common} />;

      default:
        return <div>No content available</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-lg">
            Edit Restaurant – {local?.RestroName || "Unnamed"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-100">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-2 p-2">
              {[
                "Basic Information",
                "Address & Documents",
                "Contacts",
                "Bank",
                "Future Closed",
                "Menu",
              ].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 bg-white">{renderTab()}</div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border rounded-md mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loadingStations}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md flex items-center gap-2 disabled:opacity-60"
          >
            {loadingStations && (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
