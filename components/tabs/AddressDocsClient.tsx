// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type StateItem = { id: string; name: string };
type DistrictItem = { id: string; name: string; state_id?: string };

type Props = {
  initialData?: any;
  states?: StateItem[]; // passed from server layout
  initialDistricts?: DistrictItem[]; // optional preloaded districts for restro's state
};

export default function AddressDocsClient({ initialData = {}, states = [], initialDistricts = [] }: Props) {
  const [stateList, setStateList] = useState<StateItem[]>(states || []);
  const [districtList, setDistrictList] = useState<DistrictItem[]>(initialDistricts || []);

  const [loadingStates, setLoadingStates] = useState<boolean>(!states || states.length === 0);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);

  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    StateCode: initialData?.StateCode ?? initialData?.State ?? "", // try both code and name
    DistrictCode: initialData?.DistrictCode ?? initialData?.District ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
  });

  useEffect(() => {
    // When server passed states prop, use it (avoid fetching)
    if (Array.isArray(states) && states.length > 0) {
      setStateList(states.slice());
      setLoadingStates(false);
    } else {
      // fetch states from /api/states
      setLoadingStates(true);
      fetch("/api/states")
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && Array.isArray(j.states)) {
            setStateList(j.states);
          } else if (Array.isArray(j)) {
            // in case endpoint returns array directly
            setStateList(j as StateItem[]);
          } else {
            console.warn("Unexpected /api/states response", j);
          }
        })
        .catch((e) => console.warn("fetch /api/states failed", e))
        .finally(() => setLoadingStates(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync initial StateCode if present but stateList was not available at mount
  useEffect(() => {
    if (!local.StateCode && initialData) {
      const possibleStateCode = initialData?.StateCode ?? initialData?.State ?? initialData?.StateName;
      if (possibleStateCode) {
        setLocal((s: any) => ({ ...s, StateCode: possibleStateCode }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // When stateList arrives, try to normalize local.StateCode by matching code or name
  useEffect(() => {
    if (!stateList || stateList.length === 0) return;

    const cur = local.StateCode;
    if (!cur) {
      // try to match using initialData StateName if any
      const nameFromInitial = initialData?.StateName ?? initialData?.State;
      if (nameFromInitial) {
        const target = String(nameFromInitial).trim().toLowerCase();
        const found = stateList.find((s) => String(s.name).trim().toLowerCase() === target);
        if (found) {
          setLocal((p: any) => ({ ...p, StateCode: found.id }));
        } else {
          // fuzzy partial match fallback
          const fuzzy = stateList.find((s) => String(s.name).toLowerCase().includes(target) || target.includes(String(s.name).toLowerCase()));
          if (fuzzy) setLocal((p: any) => ({ ...p, StateCode: fuzzy.id }));
        }
      }
      return;
    }

    // If cur exists but is a name (not matching any id), try to find id by name
    const byId = stateList.find((s) => String(s.id) === String(cur));
    if (!byId) {
      const target = String(cur).trim().toLowerCase();
      const foundByName = stateList.find((s) => String(s.name).trim().toLowerCase() === target);
      if (foundByName) {
        setLocal((p: any) => ({ ...p, StateCode: foundByName.id }));
        return;
      }
      const fuzzy = stateList.find((s) => String(s.name).toLowerCase().includes(target) || target.includes(String(s.name).toLowerCase()));
      if (fuzzy) {
        setLocal((p: any) => ({ ...p, StateCode: fuzzy.id }));
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateList]);

  // When StateCode changes -> load districts for that state and try to preselect District
  useEffect(() => {
    const stateCode = local.StateCode;
    if (!stateCode) {
      setDistrictList([]);
      return;
    }

    // If server passed initialDistricts and they match this state, use them
    if (initialDistricts && initialDistricts.length > 0 && initialDistricts[0].state_id) {
      const matchInit = initialDistricts.filter((d) => String(d.state_id) === String(stateCode));
      if (matchInit.length > 0) {
        setDistrictList(matchInit.slice());
        // try to preselect district by code/name
        tryPreselectDistrict(matchInit);
        return;
      }
    }

    // else fetch from API
    setLoadingDistricts(true);
    setDistrictList([]);
    fetch(`/api/districts?stateId=${encodeURIComponent(stateCode)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.districts)) {
          setDistrictList(j.districts);
          tryPreselectDistrict(j.districts);
        } else if (Array.isArray(j)) {
          setDistrictList(j as DistrictItem[]);
          tryPreselectDistrict(j as DistrictItem[]);
        } else {
          console.warn("Unexpected /api/districts response", j);
        }
      })
      .catch((e) => console.warn("fetch /api/districts failed", e))
      .finally(() => setLoadingDistricts(false));

    function tryPreselectDistrict(list: DistrictItem[]) {
      // if already have a DistrictCode, don't overwrite
      if (local.DistrictCode) return;

      const possibleDistrictCode = initialData?.DistrictCode ?? initialData?.District ?? initialData?.DistrictName;
      if (!possibleDistrictCode) return;

      // try code match first
      const foundById = list.find((d) => String(d.id) === String(possibleDistrictCode) || String(d.DistrictCode) === String(possibleDistrictCode));
      if (foundById) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(foundById.id) }));
        return;
      }

      // try name match
      const target = String(possibleDistrictCode).trim().toLowerCase();
      const foundByName = list.find((d) => String(d.name).trim().toLowerCase() === target || String((d as any).DistrictName ?? "").trim().toLowerCase() === target);
      if (foundByName) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(foundByName.id) }));
        return;
      }

      // fuzzy fallback
      const fuzzy = list.find((d) => String(d.name).toLowerCase().includes(target) || target.includes(String(d.name).toLowerCase()));
      if (fuzzy) setLocal((s: any) => ({ ...s, DistrictCode: String(fuzzy.id) }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.StateCode]);

  // Keep local in sync when initialData updates (e.g. when navigating)
  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroAddress: initialData?.RestroAddress ?? p.RestroAddress,
      City: initialData?.City ?? p.City,
      StateCode: initialData?.StateCode ?? initialData?.State ?? p.StateCode,
      DistrictCode: initialData?.DistrictCode ?? initialData?.District ?? p.DistrictCode,
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

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ textAlign: "center", marginBottom: 18, fontSize: 20 }}>Address & Documents</h3>

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
            <select
              value={local.StateCode ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                update("StateCode", v);
                // clear district when state changes
                setLocal((s: any) => ({ ...s, DistrictCode: "" }));
              }}
            >
              <option value="">{loadingStates ? "Loading states..." : "Select State"}</option>
              {stateList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>District</label>
          <div>
            <select
              value={local.DistrictCode ?? ""}
              onChange={(e) => update("DistrictCode", e.target.value)}
              disabled={!local.StateCode || loadingDistricts || districtList.length === 0}
            >
              {!local.StateCode ? <option value="">Select State first</option> : loadingDistricts ? <option value="">Loading districts...</option> : <option value="">{districtList.length ? "Select District" : "No districts"}</option>}
              {districtList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
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
      </div>

      <div style={{ height: 18 }} />

      <div className="compact-grid">
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
        textarea,
        .field select {
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
        @media (max-width: 1100px) {
          .compact-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 720px) {
          .compact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
