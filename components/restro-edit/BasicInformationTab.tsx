"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
import AdminSection from "@/components/AdminSection";
import { createClient } from "@supabase/supabase-js";

const { AdminForm } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BasicInformationTab({ local = {}, updateField }: Props) {
  const [loadingCode, setLoadingCode] = useState(false);

  /* ================= AUTO GENERATE RESTRO CODE ================= */
  useEffect(() => {
    async function generateRestroCode() {
      // Agar already hai to dobara mat banao
      if (local?.RestroCode) return;

      setLoadingCode(true);

      const { data, error } = await supabase
        .from("Restros")
        .select("RestroCode")
        .order("RestroCode", { ascending: false })
        .limit(1);

      let nextCode = 1001; // default start

      if (!error && data && data.length > 0) {
        nextCode = Number(data[0].RestroCode) + 1;
      }

      updateField("RestroCode", nextCode);
      setLoadingCode(false);
    }

    generateRestroCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminForm>
      <AdminSection title="Basic Information">
        <div className="grid grid-cols-3 gap-4 text-sm">

          {/* ================= STATION (NON EDITABLE) ================= */}
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

          {/* ================= RESTRO CODE (AUTO GENERATED) ================= */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Restro Code
            </label>
            <input
              value={
                loadingCode
                  ? "Generating..."
                  : local.RestroCode || ""
              }
              disabled
              className="w-full p-2 border rounded bg-gray-100 font-semibold"
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

          {/* IRCTC */}
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

          {/* Display Photo */}
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

          {/* Owner */}
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
