// app/admin/restros/new/basic/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";

type StationRow = {
  StationCode?: string | null;
  StationName?: string | null;
  State?: string | null;
  District?: string | null;
};

type StationOption = {
  label: string;
  value: string;
  name: string;
  state: string;
};

const DEFAULT_FORM = {
  IsIrctcApproved: "",
  IsPureVeg: "",
  RaileatsStatus: "",
};

function stationLabel(station: StationRow) {
  const name = String(station?.StationName ?? "").trim();
  const code = String(station?.StationCode ?? "").trim().toUpperCase();
  const state = String(station?.State ?? "").trim();

  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`.trim();
}

function phoneDigits(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

export default function NewRestroBasicPage() {
  const router = useRouter();
  const stationBoxRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<any>(DEFAULT_FORM);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [stationQuery, setStationQuery] = useState("");
  const [stationOpen, setStationOpen] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [displayPhotoFile, setDisplayPhotoFile] = useState<File | null>(null);
const [displayPhotoFileName, setDisplayPhotoFileName] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("new_restro_basic");
      if (!saved) return;

      const parsed = JSON.parse(saved);

      setForm((prev: any) => ({
        ...prev,
        ...parsed,
        IsIrctcApproved: parsed.IsIrctcApproved ?? "",
        IsPureVeg: parsed.IsPureVeg ?? "",
        RaileatsStatus: parsed.RaileatsStatus ?? "",
      }));

      const code = String(parsed?.StationCode ?? "").trim().toUpperCase();
      const name = String(parsed?.StationName ?? "").trim();
      const state = String(parsed?.State ?? "").trim();

      if (code || name || state) {
        setStationQuery(
          `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`.trim()
        );
      }
    } catch (error) {
      console.error("Failed to load new restro basic draft", error);
    }
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (
        stationBoxRef.current &&
        !stationBoxRef.current.contains(event.target as Node)
      ) {
        setStationOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filteredStations = useMemo(() => {
    return stations.slice(0, 50);
  }, [stations]);

  function updateField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function mapStations(rows: StationRow[]) {
    const seen = new Set<string>();

    return (rows || [])
      .map((row: StationRow) => {
        const code = String(row?.StationCode ?? "").trim().toUpperCase();
        const name = String(row?.StationName ?? "").trim();
        const state = String(row?.State ?? "").trim();

        if (!code || !name || seen.has(code)) return null;

        seen.add(code);

        return {
          value: code,
          name,
          state,
          label: stationLabel({
            StationCode: code,
            StationName: name,
            State: state,
          }),
        };
      })
      .filter(Boolean) as StationOption[];
  }

  function selectStation(station: StationOption) {
    setStationQuery(station.label);
    setStationOpen(false);

    setForm((prev: any) => ({
      ...prev,
      StationCode: station.value,
      StationName: station.name,
      State: station.state,
    }));
  }

  async function updateStationQuery(value: string) {
    const upperValue = value.toUpperCase();
    const q = upperValue.trim();

    setStationQuery(upperValue);
    setStationOpen(true);

    setForm((prev: any) => ({
      ...prev,
      StationCode: q,
      StationName: "",
      State: "",
    }));

    if (!q) {
      setStations([]);
      return;
    }

    setLoadingStations(true);

    try {
      const res = await fetch(`/api/stations?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json?.data)
  ? json.data
  : Array.isArray(json?.rows)
  ? json.rows
  : Array.isArray(json)
  ? json
  : [];

      const mapped = mapStations(rows);
      setStations(mapped);

      const exact = mapped.find((s) => {
        const code = String(s.value || "").trim().toUpperCase();
        const name = String(s.name || "").trim().toUpperCase();
        return code === q || name === q;
      });

      if (exact) {
        setForm((prev: any) => ({
          ...prev,
          StationCode: exact.value,
          StationName: exact.name,
          State: exact.state,
        }));
      }
    } catch (error) {
      console.error("Station search error", error);
      setStations([]);
    } finally {
      setLoadingStations(false);
    }
  }

  async function saveAndNext() {
    setSaving(true);
    setMsg(null);

    try {
      if (!form.RestroName || !form.StationCode || !form.StationName) {
        throw new Error("RestroName, StationCode and StationName are required");
      }

      const payload = {
        StationCode: form.StationCode || null,
        StationName: form.StationName || null,
        State: form.State || null,
        RestroName: form.RestroName || null,
        BrandNameifAny: form.BrandNameifAny || null,
        OwnerName: form.OwnerName || null,
        OwnerEmail: form.OwnerEmail || null,
        OwnerPhone: phoneDigits(form.OwnerPhone) || null,
        RestroEmail: form.RestroEmail || null,
        RestroPhone: phoneDigits(form.RestroPhone) || null,
        IsIrctcApproved: form.IsIrctcApproved || null,
        RaileatsStatus:
          form.RaileatsStatus === "" ? null : Number(form.RaileatsStatus),
        RestroRating: form.RestroRating || null,
        IsPureVeg: form.IsPureVeg === "" ? null : Number(form.IsPureVeg),
        RestroDisplayPhoto: form.RestroDisplayPhoto || null,
      };

      const existingCode =
        form.RestroCode ||
        (() => {
          try {
            return localStorage.getItem("new_restro_code") || "";
          } catch {
            return "";
          }
        })();

      const res = existingCode
        ? await fetch(`/api/restros/${encodeURIComponent(String(existingCode))}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/restrosmaster", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false || data?.error) {
        throw new Error(data?.error || "Create failed");
      }

      const code =
        existingCode ||
        data?.RestroCode ||
        data?.row?.RestroCode ||
        data?.restro_code ||
        data?.id;

      if (!code) throw new Error("Restro created but RestroCode not returned");
      let finalDisplayPhoto = payload.RestroDisplayPhoto;

if (displayPhotoFile) {
  const formData = new FormData();
  formData.append("file", displayPhotoFile);

  const uploadRes = await fetch(
    `/api/admin/restros/${encodeURIComponent(String(code))}/display-photo`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadJson = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok || uploadJson?.ok === false) {
    throw new Error(uploadJson?.error || "Display photo upload failed");
  }

  finalDisplayPhoto = uploadJson.fileName || `${code}.webp`;
}

      localStorage.setItem("new_restro_code", String(code));

      localStorage.setItem(
        "new_restro_basic",
        JSON.stringify({
          ...payload,
          ...(data?.row ?? data),
          RestroCode: code,
          RestroDisplayPhoto: finalDisplayPhoto,
          StationCode:
            data?.row?.StationCode ?? data?.StationCode ?? payload.StationCode,
          StationName:
            data?.row?.StationName ?? data?.StationName ?? payload.StationName,
          State: data?.row?.State ?? data?.State ?? payload.State,
          IsIrctcApproved:
            data?.row?.IsIrctcApproved ??
            data?.IsIrctcApproved ??
            payload.IsIrctcApproved,
          RaileatsStatus:
            data?.row?.RaileatsStatus ??
            data?.RaileatsStatus ??
            payload.RaileatsStatus,
          IsPureVeg:
            data?.row?.IsPureVeg ?? data?.IsPureVeg ?? payload.IsPureVeg,
        })
      );

      window.dispatchEvent(new Event("new-restro-code-changed"));
      router.push("/admin/restros/new/station-settings");
    } catch (error: any) {
      setMsg(error?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Basic Information"
      actions={
        <AdminButton onClick={saveAndNext} disabled={saving}>
          {saving ? "Saving..." : "Save & Next"}
        </AdminButton>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminField label="Station Code">
          <div ref={stationBoxRef} className="relative">
            <AdminInput
              value={stationQuery || form.StationCode || ""}
              onChange={(e) => updateStationQuery(e.target.value)}
              onFocus={() => {
                setStationOpen(true);
                if (stationQuery.trim()) updateStationQuery(stationQuery);
              }}
              placeholder="Type station code or name"
            />

            {stationOpen && (
              <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                {loadingStations ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    Loading stations...
                  </div>
                ) : null}

                {!loadingStations && filteredStations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    No station found
                  </div>
                ) : null}

                {!loadingStations &&
                  filteredStations.map((station) => (
                    <button
                      key={station.value}
                      type="button"
                      onClick={() => selectStation(station)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      <span className="font-semibold text-slate-900">
                        {station.value}
                      </span>
                      <span className="ml-2 text-slate-700">{station.name}</span>
                      {station.state ? (
                        <span className="ml-2 text-slate-500">
                          - {station.state}
                        </span>
                      ) : null}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </AdminField>

        <AdminField label="Station Name">
          <AdminInput value={form.StationName ?? ""} readOnly />
        </AdminField>

        <AdminField label="State">
          <AdminInput value={form.State ?? ""} readOnly />
        </AdminField>

        <AdminField label="Restro Name">
          <AdminInput
            value={form.RestroName ?? ""}
            onChange={(e) => updateField("RestroName", e.target.value)}
          />
        </AdminField>

        <AdminField label="Brand Name">
          <AdminInput
            value={form.BrandNameifAny ?? ""}
            onChange={(e) => updateField("BrandNameifAny", e.target.value)}
          />
        </AdminField>

        <AdminField label="Raileats Status">
          <AdminSelect
            value={String(form.RaileatsStatus ?? "")}
            onChange={(e) =>
              updateField(
                "RaileatsStatus",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          >
            <option value="">-- Select --</option>
            <option value="1">On</option>
            <option value="0">Off</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="IRCTC Approved">
          <AdminSelect
            value={form.IsIrctcApproved ?? ""}
            onChange={(e) => updateField("IsIrctcApproved", e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Restro Rating">
          <AdminInput
            value={form.RestroRating ?? ""}
            onChange={(e) => updateField("RestroRating", e.target.value)}
          />
        </AdminField>

        <AdminField label="Pure Veg">
          <AdminSelect
            value={String(form.IsPureVeg ?? "")}
            onChange={(e) =>
              updateField(
                "IsPureVeg",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          >
            <option value="">-- Select --</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Display Photo">
  <input
    type="file"
    accept=".webp,image/webp"
    className="block h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
    onChange={(e) => {
      const file = e.target.files?.[0] || null;

      if (!file) {
        setDisplayPhotoFile(null);
        setDisplayPhotoFileName("");
        updateField("RestroDisplayPhoto", "");
        return;
      }

      if (!file.name.toLowerCase().endsWith(".webp")) {
        alert("Only WEBP image allowed");
        e.target.value = "";
        setDisplayPhotoFile(null);
        setDisplayPhotoFileName("");
        updateField("RestroDisplayPhoto", "");
        return;
      }

      setDisplayPhotoFile(file);
      setDisplayPhotoFileName(file.name);
      updateField("RestroDisplayPhoto", file.name);
    }}
  />

  {displayPhotoFileName ? (
    <div className="mt-1 text-xs font-semibold text-green-700">
      Selected: {displayPhotoFileName}
    </div>
  ) : null}

  <div className="mt-1 text-xs text-slate-500">
    Save ke baad file name auto RestroCode.webp ho jayega.
  </div>
</AdminField>

        <AdminField label="Owner Name">
          <AdminInput
            value={form.OwnerName ?? ""}
            onChange={(e) => updateField("OwnerName", e.target.value)}
          />
        </AdminField>

        <AdminField label="Owner Email">
          <AdminInput
            value={form.OwnerEmail ?? ""}
            onChange={(e) => updateField("OwnerEmail", e.target.value)}
          />
        </AdminField>

        <AdminField label="Owner Phone">
          <AdminInput
            inputMode="numeric"
            maxLength={10}
            value={phoneDigits(form.OwnerPhone)}
            onChange={(e) => updateField("OwnerPhone", phoneDigits(e.target.value))}
          />
        </AdminField>

        <AdminField label="Restro Email">
          <AdminInput
            value={form.RestroEmail ?? ""}
            onChange={(e) => updateField("RestroEmail", e.target.value)}
          />
        </AdminField>

        <AdminField label="Restro Phone">
          <input
  inputMode="numeric"
  maxLength={10}
  value={phoneDigits(form.RestroPhone)}
  onChange={(e) => updateField("RestroPhone", phoneDigits(e.target.value))}
  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
/>
        </AdminField>
      </div>

      {msg ? (
        <div className="mt-4 text-sm font-semibold text-red-600">{msg}</div>
      ) : null}
    </AdminCard>
  );
}
