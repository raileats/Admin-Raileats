// components/restro-edit/BankTab.tsx
import React from "react";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
};

/**
 * BankTab
 *
 * Expects:
 *  - local: object (the RestroMaster row copy)
 *  - updateField: function(key, value) -> updates the parent/local copy
 *
 * Field mapping: update these constants if your RestroMaster uses different column names.
 */
const FIELD_ACCOUNT_HOLDER = "bank_account_holder"; // e.g. "Account Holder Name"
const FIELD_ACCOUNT_NUMBER = "bank_account_number";
const FIELD_IFSC = "bank_ifsc";
const FIELD_BANK_NAME = "bank_name";
const FIELD_BRANCH = "bank_branch";
const FIELD_ACTIVE = "bank_active"; // boolean or 0/1

export default function BankTab({ local, updateField, stationDisplay }: Props) {
  // helper to safely read local field values
  const val = (k: string) => {
    const v = local?.[k];
    if (v === null || typeof v === "undefined") return "";
    return v;
  };

  const onChange = (k: string, v: any) => {
    if (!updateField) return;
    updateField(k, v);
  };

  const clearAll = () => {
    onChange(FIELD_ACCOUNT_HOLDER, "");
    onChange(FIELD_ACCOUNT_NUMBER, "");
    onChange(FIELD_IFSC, "");
    onChange(FIELD_BANK_NAME, "");
    onChange(FIELD_BRANCH, "");
    onChange(FIELD_ACTIVE, false);
  };

  return (
    <div className="p-4">
      <h3 style={{ textAlign: "center", marginTop: 0 }} className="text-xl font-semibold">
        Bank
      </h3>

      <div className="max-w-[1200px] mx-auto mt-4">
        <div className="mb-3 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {stationDisplay ? `Bank details for ${stationDisplay}` : "Restaurant bank details"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="px-3 py-1 rounded bg-orange-600 text-white text-sm hover:bg-orange-700"
            >
              Add / Clear bank details
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border rounded shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account Holder */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={String(val(FIELD_ACCOUNT_HOLDER) ?? "")}
                onChange={(e) => onChange(FIELD_ACCOUNT_HOLDER, e.target.value)}
                placeholder="Account Holder Name"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={String(val(FIELD_ACCOUNT_NUMBER) ?? "")}
                onChange={(e) => onChange(FIELD_ACCOUNT_NUMBER, e.target.value)}
                placeholder="Account Number"
                inputMode="numeric"
              />
            </div>

            {/* IFSC */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={String(val(FIELD_IFSC) ?? "")}
                onChange={(e) => onChange(FIELD_IFSC, e.target.value.toUpperCase())}
                placeholder="IFSC Code"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={String(val(FIELD_BANK_NAME) ?? "")}
                onChange={(e) => onChange(FIELD_BANK_NAME, e.target.value)}
                placeholder="Bank Name"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={String(val(FIELD_BRANCH) ?? "")}
                onChange={(e) => onChange(FIELD_BRANCH, e.target.value)}
                placeholder="Branch"
              />
            </div>

            {/* Bank Active / Status */}
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bank Status</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bank_status"
                      checked={Boolean(val(FIELD_ACTIVE) === true || val(FIELD_ACTIVE) === 1)}
                      onChange={() => onChange(FIELD_ACTIVE, true)}
                    />
                    <span className="text-sm">Active</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bank_status"
                      checked={!(val(FIELD_ACTIVE) === true || val(FIELD_ACTIVE) === 1)}
                      onChange={() => onChange(FIELD_ACTIVE, false)}
                    />
                    <span className="text-sm">Inactive</span>
                  </label>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                <div>Tip:</div>
                <div>- Fill details and click Save in the main edit modal to persist.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Small debug / preview area (optional) */}
        <div className="mt-3 text-xs text-gray-500">
          <strong>Preview:</strong> {String(val(FIELD_ACCOUNT_HOLDER) || "—")} {val(FIELD_ACCOUNT_NUMBER) ? "• " + val(FIELD_ACCOUNT_NUMBER) : ""}
        </div>
      </div>
    </div>
  );
}
