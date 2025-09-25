// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type StateItem = { id: string; name: string };
type DistrictItem = { id: string; name: string; state_id?: string };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[]; // server can pass preloaded states
  initialDistricts?: DistrictItem[]; // server can pass preloaded districts for restro's state
};

export default function AddressDocsClient({ initialData = {}, imagePrefix = "", states = [], initialDistricts = [] }: Props) {
  const [stateList, setStateList] = useState<StateItem[]>(states || []);
  const [districtList, setDistrictList] = useState<DistrictItem[]>(initialDistricts || []);

  const [loadingStates, setLoadingStates] = useState<boolean>(!states || states.length === 0);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);

  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    StateCode: initialData?.StateCode ?? initialData?.State ?? "", // prefer StateCode if present
    DistrictCode: initialData?.DistrictCode ?? initialData?.District ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? initialData?.FSSAI ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
  });

  // load states if not provided by server
  useEffect(() => {
    if (Array.isArray(states) && states.length > 0) {
      setStateList(states.slice());
      setLoadingStates(false);
      return;
    }
    setLoadingStates(true);
    fetch("/api/states")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.states)) setStateList(j.states);
        else if (Array.isArray(j)) setStateList(j as StateItem[]);
        else console.warn("Unexpected /api/states response:", j);
      })
      .catch((e) => console.warn("fetch /api/states failed", e))
      .finally(() => setLoadingStates(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // normalize StateCode when stateList arrives (match by code or by name)
  useEffect(() => {
    if (!stateList || stateList.length === 0) return;

    const cur = local.StateCode;
    // if not set, try to pick from initialData State/StateName
    if (!cur) {
      const nameFromInitial = initialData?.State ?? initialData?.StateName;
      if (nameFromInitial) {
        const target = String(nameFromInitial).trim().toLowerCase();
        const found = stateList.find((s) => String(s.name).trim().toLowerCase() === target);
        if (found) {
          setLocal((p: any) => ({ ...p, StateCode: found.id }));
          return;
        }
        const fuzzy = stateList.find((s) => String(s.name).toLowerCase().includes(target) || target.includes(String(s.name).toLowerCase()));
        if (fuzzy) {
          setLocal((p: any) => ({ ...p, StateCode: fuzzy.id }));
          return;
        }
      }
      return;
    }

    // if cur exists but doesn't match an id, try to find id by name
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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateList]);

  // when StateCode changes, load districts and attempt preselect
  useEffect(() => {
    const stateCode = local.StateCode;
    if (!stateCode) {
      setDistrictList([]);
      return;
    }

    // if initialDistricts provided and they match this state -> use them
    if (initialDistricts && initialDistricts.length > 0 && initialDistricts.some((d) => String(d.state_id) === String(stateCode))) {
      const matched = initialDistricts.filter((d) => String(d.state_id) === String(stateCode));
      setDistrictList(matched.slice());
      // try preselect district
      tryPreselectDistrict(matched);
      return;
    }

    // fetch districts for this state
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
      if (local.DistrictCode) return; // don't override if already set
      const possible = initialData?.DistrictCode ?? initialData?.District ?? initialData?.DistrictName;
      if (!possible) return;

      // match by id/code first
      const foundById = list.find((d) => String(d.id) === String(possible) || String((d as any).DistrictCode) === String(possible));
      if (foundById) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(foundById.id) }));
        return;
      }

      // match by name
      const target = String(possible).trim().toLowerCase();
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

  // keep local synced when initialData changes (navigate to other restro)
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
      RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? p.RestroDisplayPhoto ?? "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return (imagePrefix ?? "") + p;
  };

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
          <select
            value={local.StateCode ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setLocal((s: any) => ({ ...s, StateCode: v, DistrictCode: "" })); // clear district when state changes
            }}
            onFocus={() => {
              if (!stateList || stateList.length === 0) {
                setLoadingStates(true);
                fetch("/api/states")
                  .then((r) => r.json())
                  .then((j) => {
                    if (j?.ok && Array.isArray(j.states)) setStateList(j.states);
                    else if (Array.isArray(j)) setStateList(j as StateItem[]);
                  })
                  .finally(() => setLoadingStates(false));
              }
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

        <div className="field">
          <label>District</label>
          <select
            value={local.DistrictCode ?? ""}
            onChange={(e) => update("DistrictCode", e.target.value)}
            disabled={!local.StateCode || loadingDistricts || districtList.length === 0}
            onFocus={() => {
              if ((!districtList || districtList.length === 0) && local.StateCode) {
                setLoadingDistricts(true);
                fetch(`/api/districts?stateId=${encodeURIComponent(local.StateCode)}`)
                  .then((r) => r.json())
                  .then((j) => {
                    if (j?.ok && Array.isArray(j.districts)) setDistrictList(j.districts);
                    else if (Array.isArray(j)) setDistrictList(j as DistrictItem[]);
                  })
                  .finally(() => setLoadingDistricts(false));
              }
            }}
          >
            {!local.StateCode ? <option value="">Select State first</option> : loadingDistricts ? <option value="">Loading districts...</option> : <option value="">{districtList.length ? "Select District" : "No districts"}</option>}
            {districtList.map((d) => (
              <option key={d.id} value={d.id}>
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

        <div className="field">
          <label>Display Preview</label>
          {local.RestroDisplayPhoto ? <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <div className="readonly">No image</div>}
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
        .preview {
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        .readonly {
          padding: 8px 10px;
          border-radius: 6px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          font-size: 13px;
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
