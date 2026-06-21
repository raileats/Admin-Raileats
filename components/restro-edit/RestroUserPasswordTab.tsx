"use client";

import { useState } from "react";

type Props = {
  form: any;
  setForm: any;
  onSaved?: () => void;
};

export default function RestroUserPasswordTab({
  form,
  setForm,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function saveLoginDetails() {
    try {
      setMsg("");

      if (!form?.RestroCode) {
        alert("Restro Code missing");
        return;
      }

      if (!form?.RestroLoginMobile || form.RestroLoginMobile.length !== 10) {
        alert("Restro Login Mobile 10 digit hona chahiye");
        return;
      }

      if (!form?.RestroPassword) {
        alert("Restro Password required hai");
        return;
      }

      setSaving(true);

      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(form.RestroCode))}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
          body: JSON.stringify({
            RestroLoginMobile: form.RestroLoginMobile,
            RestroPassword: form.RestroPassword,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Save failed");
      }

      setMsg("Saved successfully");

      if (typeof onSaved === "function") {
        setTimeout(() => {
          onSaved();
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded bg-white">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h3 className="font-bold text-base">Restro User & Password</h3>
          <p className="text-sm text-gray-500">
            Manage restaurant login credentials
          </p>
        </div>

        <button
          type="button"
          onClick={saveLoginDetails}
          disabled={saving}
          className={`px-6 py-2 rounded text-white ${
            saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 p-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Restro Login Mobile
          </label>

          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={form?.RestroLoginMobile || ""}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, "");
              value = value.slice(0, 10);

              setForm((prev: any) => ({
                ...prev,
                RestroLoginMobile: value,
              }));
            }}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter 10 digit mobile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Restro Password
          </label>

          <input
            type="text"
            value={form?.RestroPassword || ""}
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                RestroPassword: e.target.value,
              }))
            }
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter password"
          />
        </div>

        {msg && (
          <div className="col-span-2 text-sm font-medium text-blue-600">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
