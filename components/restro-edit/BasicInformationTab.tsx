"use client";

import React, { useEffect } from "react";
import UI from "@/components/AdminUI";
import AdminSection from "@/components/AdminSection";

const { AdminForm } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

export default function BasicInformationTab({
  local = {},
  updateField,
}: Props) {

  /**
   * IMPORTANT:
   * If RestroCode already exists (edit case),
   * ensure it is always pushed to parent state
   * so SAVE never throws "Missing RestroCode"
   */
  useEffect(() => {
    if (local?.RestroCode) {
      updateField("RestroCode", local.RestroCode);
    }
  }, [local?.RestroCode, updateField]);

  return (
    <AdminForm>
      <AdminSection title="Basic Information">
        <div className="grid grid-cols-3 gap-4 text-sm">

          {/* ================= STATION (READ ONLY) ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Station *
            </label>
            <input
              value={local.Station || ""}
              disabled
              className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* ================= RESTRO CODE (AUTO GENERATED) ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Code
            </label>
            <input
              value={local.RestroCode || ""}
              disabled
              placeholder="Auto generated"
              className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* ================= RESTRO NAME ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Name *
            </label>
            <input
              value={local.RestroName || ""}
              onChange={(e) =>
                updateField("RestroName", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= BRAND NAME ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Brand Name
            </label>
            <input
              value={local.BrandName || ""}
              onChange={(e) =>
                updateField("BrandName", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= RAIL EATS STATUS ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              RailEats Status
            </label>
            <select
              value={local.RailEatsStatus ? "on" : "off"}
              onChange={(e) =>
                updateField("RailEatsStatus", e.target.value === "on")
              }
              className="w-full p-2 border rounded"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>

          {/* ================= IRCTC APPROVAL ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Is IRCTC Approved
            </label>
            <select
              value={local.IsIRCTCApproved || "No"}
              onChange={(e) =>
                updateField("IsIRCTCApproved", e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* ================= RATING ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Rating
            </label>
            <input
              value={local.RestroRating || ""}
              onChange={(e) =>
                updateField("RestroRating", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= DISPLAY PHOTO ================= */}
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600">
              Display Photo (path)
            </label>
            <input
              value={local.RestroDisplayPhoto || ""}
              onChange={(e) =>
                updateField("RestroDisplayPhoto", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= OWNER NAME ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Owner Name
            </label>
            <input
              value={local.OwnerName || ""}
              onChange={(e) =>
                updateField("OwnerName", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= OWNER EMAIL ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Owner Email
            </label>
            <input
              value={local.OwnerEmail || ""}
              onChange={(e) =>
                updateField("OwnerEmail", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= OWNER PHONE ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Owner Phone
            </label>
            <input
              value={local.OwnerPhone || ""}
              onChange={(e) =>
                updateField("OwnerPhone", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= RESTRO EMAIL ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Email
            </label>
            <input
              value={local.RestroEmail || ""}
              onChange={(e) =>
                updateField("RestroEmail", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ================= RESTRO PHONE ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Phone
            </label>
            <input
              value={local.RestroPhone || ""}
              onChange={(e) =>
                updateField("RestroPhone", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </AdminSection>
    </AdminForm>
  );
}
