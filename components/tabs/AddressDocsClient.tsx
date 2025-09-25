// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type StateItem = { id: string | number; name: string };
type DistrictItem = { id: string | number; name: string; state_id?: string | number };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[]; // optional server-supplied
  initialDistricts?: DistrictItem[]; // optional server-supplied
};

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  states = [],
  initialDistricts = [],
}: Props) {
  const router = useRouter();

  const mountedRef = useRef(true);
  const statesFetchedRef = useRef(false); // to avoid re-fetching repeatedly
  const districtFetchController = useRef<AbortController | null>(null);

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

  const [stateList, setStateList] = useState<StateItem[]>(Array.isArray(states) ? states : []);
  const [districts, setDistricts] = useState<DistrictItem[]>(Array.isArray(initialDistricts) ? initialDistricts : []);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // cleanup any inflight district fetch
      if (districtFetchController.current) {
        districtFetchController.current.abort();
      }
    };
  }, []);

  // keep local in sync if initialData changes (but do not clobber stateList)
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

  // Load states once: prefer server-provided `states` prop, otherwise fetch
  useEffect(() => {
    if (Array.isArray(states) && states.length > 0) {
      setStateList(states);
      statesFetchedRef.current = true;
      return;
    }

    // if already fetched, don't re-fetch repeatedly
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
          // don't clobber stateList if it had values; show error instead
          setErr(json?.error ?? `Failed to load states (${res.status})`);
          console.warn("states load error", json);
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

  // When StateCode changes -> load districts (with cancellation)
  useEffect(() => {
    const stateCode = local.StateCode;
    // clear districts immediately when StateCode cleared
    if (!stateCode) {
      // abort any inflight
      if (districtFetchController.current) {
        districtFetchController.current.abort();
        districtFetchController.current = null;
      }
      setDistricts([]);
      setLocal((s:any) => ({ ...s, DistrictCode: "" }));
      return;
    }

    // if initialDistricts provided and belong to this state, use them
    if (Array.isArray(initialDistricts) && initialDistricts.length > 0) {
      const belongs = initialDistricts.some((d) => String(d.state_id) === String(stateCode));
      if (belongs) {
        setDistricts(initialDistricts.filter((d) => String(d.state_id) === String(stateCode)));
        return;
      }
    }

    // fetch districts
    const controller = new AbortController();
    districtFetchController.current = controller;

    (async () => {
      try {
        setLoadingDistricts(true);
        const res = await fetch(`/api/districts?stateId=${encodeURIComponent(String(stateCode))}`, {
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok && Array.isArray(json.districts)) {
          if (!mountedRef.current) return;
          setDistricts(json.districts);
          setErr(null);
        } else {
          setDistricts([]);
          setErr(json?.error ?? `Failed to load districts (${res.status})`);
          console.warn("districts load error", json);
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          // aborted - ignore
        } else {
          console.error("district fetch error", e);
          setErr("Failed to load districts: " + String(e?.message ?? e));
          setDistricts([]);
        }
      } finally {
        if (mountedRef.current) setLoadingDistricts(false);
      }
    })();

    return () => {
      // abort on cleanup
      if (districtFetchController.current) {
        districtFetchController.current.abort();
        districtFetchController.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.StateCode]);

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
          <div>
            {err && <div style={{ color: "red", marginBottom: 6 }}>{err}</div>}
            <select
              value={local.StateCode ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                update("StateCode", v ?? "");
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
