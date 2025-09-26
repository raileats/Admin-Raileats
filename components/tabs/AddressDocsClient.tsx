"use client";

import React, { useEffect, useState } from "react";

type StateItem = { id: string; name: string };
type DistrictItem = { id: string; name: string; state_id?: string };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[]; // server-provided
  initialDistricts?: DistrictItem[]; // server-provided for restro's state
};

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  states = [],
  initialDistricts = [],
}: Props) {
  const [stateList, setStateList] = useState<StateItem[]>(states || []);
  const [districtList, setDistrictList] = useState<DistrictItem[]>(
    initialDistricts || []
  );

  const [loadingStates, setLoadingStates] = useState<boolean>(
    !states || states.length === 0
  );
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);

  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    // StateCode may be code or name — we normalize later
    StateCode:
      initialData?.StateCode ?? initialData?.State ?? initialData?.StateName ?? "",
    // DistrictCode may be code or name or the RestroMaster column "Districts"
    DistrictCode:
      initialData?.DistrictCode ??
      initialData?.District ??
      initialData?.DistrictName ??
      initialData?.Districts ??
      "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
  });

  // Load states if server didn't pass them
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
        console.log("DEBUG /api/states response ->", j);
        if (j?.ok && Array.isArray(j.states)) setStateList(j.states);
        else if (Array.isArray(j)) setStateList(j as StateItem[]);
        else console.warn("Unexpected /api/states response", j);
      })
      .catch((e) => console.warn("fetch /api/states failed", e))
      .finally(() => setLoadingStates(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When initialData arrives/changes, set local base values (keeps District/State codes present)
  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroAddress: initialData?.RestroAddress ?? p.RestroAddress,
      City: initialData?.City ?? p.City,
      StateCode: initialData?.StateCode ?? initialData?.State ?? p.StateCode,
      DistrictCode:
        initialData?.DistrictCode ??
        initialData?.District ??
        initialData?.DistrictName ??
        initialData?.Districts ??
        p.DistrictCode,
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

  // When stateList arrives, normalize local.StateCode (try code then name -> set to id)
  useEffect(() => {
    if (!stateList || stateList.length === 0) return;

    const cur = local.StateCode;
    const setStateCodeById = (idVal: string) => {
      setLocal((s: any) => ({ ...s, StateCode: idVal, DistrictCode: "" })); // clear district when state set
    };

    if (!cur) {
      const nameFromInitial = initialData?.StateName ?? initialData?.State;
      if (nameFromInitial) {
        const target = String(nameFromInitial).trim().toLowerCase();
        const exact = stateList.find(
          (s) => String(s.name).trim().toLowerCase() === target
        );
        if (exact) {
          setStateCodeById(exact.id);
          return;
        }
        const fuzzy = stateList.find(
          (s) =>
            String(s.name).toLowerCase().includes(target) ||
            target.includes(String(s.name).toLowerCase())
        );
        if (fuzzy) {
          setStateCodeById(fuzzy.id);
          return;
        }
      }
      return;
    }

    // cur exists; if it doesn't match any id, try matching by name
    const byId = stateList.find((s) => String(s.id) === String(cur));
    if (!byId) {
      const target = String(cur).trim().toLowerCase();
      const foundByName = stateList.find(
        (s) => String(s.name).trim().toLowerCase() === target
      );
      if (foundByName) {
        setStateCodeById(foundByName.id);
        return;
      }
      const fuzzy = stateList.find(
        (s) =>
          String(s.name).toLowerCase().includes(target) ||
          target.includes(String(s.name).toLowerCase())
      );
      if (fuzzy) {
        setStateCodeById(fuzzy.id);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateList]);

  // When StateCode changes -> load districts for that state and preselect district
  useEffect(() => {
    const stateCode = local.StateCode;
    if (!stateCode) {
      setDistrictList([]);
      return;
    }

    // If server passed initialDistricts and they match this state, use them
    if (
      Array.isArray(initialDistricts) &&
      initialDistricts.length > 0 &&
      initialDistricts[0].state_id
    ) {
      const matchInit = initialDistricts.filter(
        (d) => String(d.state_id) === String(stateCode)
      );
      if (matchInit.length > 0) {
        setDistrictList(matchInit.slice());
        tryPreselectDistrict(matchInit);
        return;
      }
    }

    // fetch districts from api
    setLoadingDistricts(true);
    setDistrictList([]);
    fetch(`/api/districts?stateId=${encodeURIComponent(stateCode)}`)
      .then((r) => r.json())
      .then((j) => {
        // debug line so you can inspect the full JSON in browser console
        console.log("DEBUG /api/districts response for stateId=", stateCode, "->", j);

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

    // tryPreselectDistrict definition
    function tryPreselectDistrict(list: DistrictItem[]) {
      // if already set by user, do not overwrite
      if (local.DistrictCode) return;

      // Accept multiple possible initial fields: DistrictCode, District, DistrictName, Districts (RestroMaster)
      const possible =
        initialData?.DistrictCode ??
        initialData?.District ??
        initialData?.DistrictName ??
        initialData?.Districts ??
        null;
      if (!possible) return;

      const targetRaw = String(possible).trim();
      const targetLower = targetRaw.toLowerCase();

      // exact id/code
      const foundById = list.find(
        (d) => String(d.id) === targetRaw || String((d as any).DistrictCode) === targetRaw
      );
      if (foundById) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(foundById.id) }));
        return;
      }

      // exact name (case-insensitive)
      const foundByName = list.find(
        (d) =>
          String(d.name).trim().toLowerCase() === targetLower ||
          String((d as any).DistrictName ?? "").trim().toLowerCase() === targetLower
      );
      if (foundByName) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(foundByName.id) }));
        return;
      }

      // fuzzy
      const fuzzy = list.find(
        (d) =>
          String(d.name).toLowerCase().includes(targetLower) ||
          targetLower.includes(String(d.name).toLowerCase())
      );
      if (fuzzy) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(fuzzy.id) }));
        return;
      }

      // token match
      const tokens = targetLower.split(/[\s\-_.,]+/).filter(Boolean);
      if (tokens.length > 0) {
        const tokenMatch = list.find((d) => {
          const nm = String(d.name).toLowerCase();
          return tokens.every((t) => nm.includes(t));
        });
        if (tokenMatch) {
          setLocal((s: any) => ({ ...s, DistrictCode: String(tokenMatch.id) }));
          return;
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.StateCode, initialDistricts, initialData]);

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
      <h3 style={{ textAlign: "center", marginBottom: 18, fontSize: 20 }}>
        Address & Documents
      </h3>

      <div className="compact-grid">
        <div className="field full-col">
          <label>Restro Address</label>
          <textarea
            value={local.RestroAddress ?? ""}
            onChange={(e) => update("RestroAddress", e.target.value)}
          />
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
                // set state and clear district so district-effect runs cleanly
                setLocal((s: any) => ({ ...s, StateCode: v, DistrictCode: "" }));
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
              {!local.StateCode ? (
                <option value="">Select State first</option>
              ) : loadingDistricts ? (
                <option value="">Loading districts...</option>
              ) : (
                <option value="">{districtList.length ? "Select District" : "No districts"}</option>
              )}
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

        <div className="field">
          <label>Display Preview</label>
          {local.RestroDisplayPhoto ? (
            <img
              src={imgSrc(local.RestroDisplayPhoto)}
              alt="display"
              className="preview"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div className="readonly">No image</div>
          )}
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
