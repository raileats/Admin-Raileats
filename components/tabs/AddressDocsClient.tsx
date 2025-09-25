// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StateItem = { id: string | number; name: string };
type DistrictItem = { id: string | number; name: string; state_id?: string | number };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[]; // optional server-supplied
  initialDistricts?: DistrictItem[]; // optional server-supplied if StateCode present
};

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  states = [],
  initialDistricts = [],
}: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    StateCode: initialData?.StateCode ?? (initialData?.StateId ?? "") ?? "", // try multiple possible fields
    DistrictCode: initialData?.DistrictCode ?? (initialData?.DistrictId ?? "") ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
  });

  const [stateList, setStateList] = useState<StateItem[]>(Array.isArray(states) ? states : []);
  const [districts, setDistricts] = useState<DistrictItem[]>(Array.isArray(initialDistricts) ? initialDistricts : []);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // normalize initialData if it changes
  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroAddress: initialData?.RestroAddress ?? p.RestroAddress,
      City: initialData?.City ?? p.City,
      StateCode: initialData?.StateCode ?? initialData?.StateId ?? p.StateCode ?? "",
      DistrictCode: initialData?.DistrictCode ?? initialData?.DistrictId ?? p.DistrictCode ?? "",
      PinCode: initialData?.PinCode ?? p.PinCode,
      Latitude: initialData?.Latitude ?? p.Latitude,
      Longitude: initialData?.Longitude ?? p.Longitude,
      FSSAINumber: initialData?.FSSAINumber ?? p.FSSAINumber,
      FSSAIExpiry: initialData?.FSSAIExpiry ?? p.FSSAIExpiry,
      GSTNumber: initialData?.GSTNumber ?? p.GSTNumber,
      GSTType: initialData?.GSTType ?? p.GSTType,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // load states if server didn't provide
  useEffect(() => {
    if ((!states || states.length === 0) && !loadingStates) {
      (async () => {
        try {
          setLoadingStates(true);
          const res = await fetch("/api/states");
          const json = await res.json().catch(() => null);
          if (res.ok && json?.ok && Array.isArray(json.states)) {
            setStateList(json.states);
          } else {
            setStateList([]);
            console.warn("Failed to load /api/states", json);
          }
        } catch (e) {
          console.error("states fetch error", e);
          setStateList([]);
        } finally {
          setLoadingStates(false);
        }
      })();
    } else {
      setStateList(states ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);

  // when StateCode changes, fetch districts (unless initialDistricts provided)
  useEffect(() => {
    if (!local.StateCode) {
      setDistricts([]);
      return;
    }

    // if initialDistricts given and they belong to this state, keep them;
    // otherwise fetch fresh.
    if (initialDistricts && initialDistricts.length > 0) {
      const belongs = initialDistricts.some((d) => String(d.state_id) === String(local.StateCode));
      if (belongs) {
        setDistricts(initialDistricts);
        return;
      }
    }

    fetchDistricts(local.StateCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.StateCode]);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setMsg(null);
    setErr(null);
  }

  async function fetchDistricts(stateCode: string | number) {
    if (!stateCode) {
      setDistricts([]);
      return;
    }
    try {
      setLoadingDistricts(true);
      const res = await fetch(`/api/districts?stateId=${encodeURIComponent(String(stateCode))}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok && Array.isArray(json.districts)) {
        setDistricts(json.districts);
      } else {
        setDistricts([]);
        console.warn("Failed to load /api/districts", json);
      }
    } catch (e) {
      console.error("districts fetch error", e);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const id = encodeURIComponent(String(initialData?.RestroCode ?? ""));
      const payload: Record<string, any> = {
        RestroAddress: local.RestroAddress ?? null,
        City: local.City ?? null,
        // send StateCode/DistrictCode as that is your table's keys
        StateCode: local.StateCode ?? null,
        DistrictCode: local.DistrictCode ?? null,
        PinCode: local.PinCode ?? null,
        Latitude: local.Latitude ?? null,
        Longitude: local.Longitude ?? null,
        FSSAINumber: local.FSSAINumber ?? null,
        FSSAIExpiry: local.FSSAIExpiry ?? null,
        GSTNumber: local.GSTNumber ?? null,
        GSTType: local.GSTType ?? null,
      };

      const res = await fetch(`/api/restros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `Save failed (${res.status})`);
      }

      setMsg("Saved successfully");
      router.refresh();
    } catch (e: any) {
      console.error("Save error:", e);
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ textAlign: "center", marginBottom: 18, fontSize: 20 }}>Address &amp; Documents</h3>

      <div className="compact-grid">
        <div className="field full-col">
          <label>Restro Address</label>
          <textarea value={local.RestroAddress ?? ""} onChange={(e) => update("RestroAddress", e.target.value)} />
        </div>

        <div className="field">
          <label>City / Village</label>
          <input value={local.City ?? ""} onChange={(e) => update("City", e.target.value)} />
        </div>

        <div className="field">
          <label>State</label>
          <select
            value={local.StateCode ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              update("StateCode", v ?? "");
              update("DistrictCode", ""); // clear district on state change
            }}
          >
            <option value="">{loadingStates ? "Loading states..." : "Select State"}</option>
            {stateList.map((s) => (
              <option key={String(s.id)} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>District</label>
          <select
            value={local.DistrictCode ?? ""}
            onChange={(e) => update("DistrictCode", e.target.value ?? "")}
            disabled={!local.StateCode || loadingDistricts}
          >
            <option value="">{!local.StateCode ? "Select State first" : loadingDistricts ? "Loading..." : "Select District"}</option>
            {districts.map((d) => (
              <option key={String(d.id)} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Pin Code</label>
          <input value={local.PinCode ?? ""} onChange={(e) => update("PinCode", e.target.value)} />
        </div>

        <div className="field">
          <label>Latitude</label>
          <input value={local.Latitude ?? ""} onChange={(e) => update("Latitude", e.target.value)} />
        </div>

        <div className="field">
          <label>Longitude</label>
          <input value={local.Longitude ?? ""} onChange={(e) => update("Longitude", e.target.value)} />
        </div>

        <div className="field">
          <label>FSSAI Number</label>
          <input value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} />
        </div>

        <div className="field">
          <label>FSSAI Expiry</label>
          <input type="date" value={local.FSSAIExpiry ?? ""} onChange={(e) => update("FSSAIExpiry", e.target.value)} />
        </div>

        <div className="field">
          <label>GST Number</label>
          <input value={local.GSTNumber ?? ""} onChange={(e) => update("GSTNumber", e.target.value)} />
        </div>

        <div className="field">
          <label>GST Type</label>
          <input value={local.GSTType ?? ""} onChange={(e) => update("GSTType", e.target.value)} />
        </div>
      </div>

      <div className="actions">
        <button className="btn-cancel" onClick={() => router.push("/admin/restros")} disabled={saving}>
          Cancel
        </button>
        <button className="btn-save" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {msg && <div style={{ color: "green", marginTop: 10 }}>{msg}</div>}
      {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .field.full-col {
          grid-column: 1 / -1;
        }
        .field label {
          display: block;
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .field input,
        .field select,
        textarea {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }
        textarea {
          min-height: 80px;
          resize: vertical;
        }
        .actions {
          max-width: 1100px;
          margin: 18px auto 0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-cancel {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
        }
        .btn-save {
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          background: #0ea5e9;
          color: #fff;
          cursor: pointer;
        }
        @media (max-width: 1100px) {
          .compact-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 720px) {
          .compact-grid {
            grid-template-columns: 1fr;
          }
          .actions {
            padding: 0 12px;
          }
        }
      `}</style>
    </div>
  );
}
