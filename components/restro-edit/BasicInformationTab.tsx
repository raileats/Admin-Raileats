"use client";

import React from "react";
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
  return (
    <AdminForm>
      <AdminSection title="Basic Information">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {/* Station */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Station *
            </label>
            <input
              value={local.Station || ""}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>

          {/* Restro Code */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Code
            </label>
            <input
              value={local.RestroCode || ""}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>

          {/* Restro Name */}
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

          {/* Brand Name */}
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

          {/* RailEats Status */}
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

          {/* IRCTC Approved */}
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

          {/* Rating */}
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

          {/* Display Photo Path */}
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

          {/* Owner Name */}
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

          {/* Owner Email */}
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

          {/* Owner Phone */}
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

          {/* Restro Email */}
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

          {/* Restro Phone */}
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
