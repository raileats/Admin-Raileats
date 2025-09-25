// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type StateItem = { id: string | number; name: string };
type DistrictItem = { id: string | number; name: string; state_id?: string | number };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[]; // optional server-supplied states list
  initialDistricts?: DistrictItem[]; // optional server-supplied districts
};

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  states = [],
  initialDistricts = [],
}: Props) {
  const router = useRouter();
  const mountedRef = useRef(true);

  // local form state (use StateCode/DistrictCode as the selected ids)
  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    StateCode: initialData?.StateCode ?? initialData?.StateId ?? "",
    DistrictCode: initialData?.DistrictCode ?? initialData?.DistrictId ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
  });

  // lists + loading / error flags
  const [stateList, setStateList] = useState<StateItem[]>(Array.isArray(states) ? states : []);
  const [districts, setDistricts] = useState<DistrictItem[]>(Array.isArray(initialDistricts) ? initialDistricts : []);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // keep reference whether we've fetched states once to avoid repeated re-fetches
  const statesFetchedRef = useRef(false);
  const districtAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (districtAbortRef.current) districtAbortRef.current.abort();
    };
  }, []);

  // sync initialData -> local if initialData changes
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

  // load states once (prefer server-provided `states` prop)
  useEffect(() => {
    if (Array.isArray(states) && states.length > 0) {
      setStateList(states);
      statesFetchedRef.current = true;
      return;
    }
    if (statesFetchedRef.current) return;

    (async () => {
      try {
        setLoadingStates(true);
        const res = await fetch("/api/states");
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok && Array.isArray(json.states)) {
          if (!mountedRef.current) return;
          setStateList(json.states);
          statesFetchedRef.current = true;
          setErr(null);
        } else {
          setErr(json?.error ?? `Failed to load states (${res?.status})`);
          console.warn("states error", json);
        }
      } catch (e: any) {
        setErr("Failed to load states: " + String(e?.message ?? e));
        console.error(e);
      } finally {
        if (mountedRef.current) setLoadingStates(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When StateCode changes -> load districts for that state
  useEffect(() => {
    const currentState = local.StateCode;
    if (!currentState) {
      // clear districts and district selection
      if (districtAbortRef.current) {
        districtAbortRef.current.abort();
        districtAbortRef.current = null;
      }
      setDistricts([]);
      setLocal((s:any)=> ({...s, DistrictCode: ""}));
      return;
    }

    // abort prior
    if (districtAbortRef.current) {
      districtAbortRef.current.abort();
      districtAbortRef.current = null;
    }
    const controller = new AbortController();
    districtAbortRef.current = controller;

    (async () => {
      try {
        setLoadingDistricts(true);
        const res = await fetch(`/api/districts?stateId=${encodeURIComponent(String(currentState))}`, { signal: controller.signal });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok && Array.isArray(json.districts)) {
          if (!mountedRef.current) return;
          setDistricts(json.districts);
          // if initial local.DistrictCode exists, keep it (so preselect stays)
          setErr(null);
        } else {
          setDistricts([]);
          setErr(json?.error ?? `Failed to load districts (${res?.status})`);
          console.warn("districts error", json);
        }
      } catch (e:any) {
        if (e.name !== "AbortError") {
          setErr("Failed to load districts: " + String(e?.message ?? e));
          setDistricts([]);
          console.error(e);
        }
      } finally {
        if (mountedRef.current) setLoadingDistricts(false);
      }
    })();

    return () => {
      if (districtAbortRef.current) {
        districtAbortRef.current.abort();
        districtAbortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.StateCode]);

  // Safety: if stateList arrives later but local.StateCode already set, ensure districts are fetched
  useEffect(() => {
    if (!local.StateCode) return;
    // if we already have districts for this state, do nothing
    if (districts.length > 0 && String(districts[0].state_id) === String(local.StateCode)) return;

    // trigger districts fetch (will be handled by the previous useEffect because it watches local.StateCode)
    // so just re-set local.StateCode to itself to ensure effect runs only if needed
    setLocal((s:any)=> ({...s}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateList]);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setMsg(null);
    setErr(null);
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
      const json = await res.json().catch(()=>null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Save failed (${res?.status})`);
      setMsg("Saved successfully");
      router.refresh();
    } catch (e:any) {
      setErr(e?.message ?? "Save failed");
      console.error("Save error", e);
    } finally {
      if (mountedRef.current) setSaving(false);
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
              // clear district selection whenever state changes
              update("DistrictCode", "");
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
            disabled={!local.StateCode || loadingDistricts || districts.length === 0}
          >
            <option value="">
              {!local.StateCode ? "Select State first" : loadingDistricts ? "Loading districts..." : districts.length === 0 ? "No districts" : "Select District"}
            </option>
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
