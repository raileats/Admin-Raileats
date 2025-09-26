// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type StateItem = { id: string; name: string };
type DistrictItem = { id: string; name: string; state_id?: string; [k: string]: any };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[]; // server-provided
  initialDistricts?: DistrictItem[]; // server-provided for restro's state
};

function normalizeText(s: any) {
  if (s === null || s === undefined) return "";
  // remove diacritics, lower-case, remove common punctuation/words
  return String(s)
    .normalize?.("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[\.\'\"]/g, "")
    .replace(/\b(district|dist|districts)\b/gi, "")
    .replace(/[^a-z0-9\s\-]/gi, "")
    .trim()
    .toLowerCase();
}

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  states = [],
  initialDistricts = [],
}: Props) {
  const [stateList, setStateList] = useState<StateItem[]>(states || []);
  const [districtList, setDistrictList] = useState<DistrictItem[]>(initialDistricts || []);

  const [loadingStates, setLoadingStates] = useState<boolean>(!states || states.length === 0);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);

  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    StateCode: initialData?.StateCode ?? initialData?.State ?? initialData?.StateName ?? "",
    DistrictCode: initialData?.DistrictCode ?? initialData?.District ?? initialData?.DistrictName ?? initialData?.Districts ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
  });

  // --- load states if not passed by server ---
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
        console.log("DEBUG /api/states ->", j);
        if (j?.ok && Array.isArray(j.states)) setStateList(j.states);
        else if (Array.isArray(j)) setStateList(j as StateItem[]);
        else console.warn("/api/states unexpected", j);
      })
      .catch((e) => console.warn("fetch /api/states failed", e))
      .finally(() => setLoadingStates(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync initialData into local (on navigation)
  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroAddress: initialData?.RestroAddress ?? p.RestroAddress,
      City: initialData?.City ?? p.City,
      StateCode: initialData?.StateCode ?? initialData?.State ?? p.StateCode,
      DistrictCode: initialData?.DistrictCode ?? initialData?.District ?? initialData?.DistrictName ?? p.DistrictCode,
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

  // normalize state when stateList loads
  useEffect(() => {
    if (!stateList || stateList.length === 0) return;
    const cur = local.StateCode;
    const setStateCode = (idVal: string) => setLocal((s: any) => ({ ...s, StateCode: idVal, DistrictCode: "" }));

    if (!cur) {
      const look = initialData?.StateName ?? initialData?.State;
      if (look) {
        const t = normalizeText(look);
        const found = stateList.find((s) => normalizeText(s.name) === t || normalizeText(s.id) === t);
        if (found) {
          setStateCode(found.id);
          return;
        }
      }
      return;
    }

    // if cur doesn't match any id, try match by name
    const byId = stateList.find((s) => String(s.id) === String(cur));
    if (!byId) {
      const t = normalizeText(cur);
      const found = stateList.find((s) => normalizeText(s.name) === t || normalizeText(s.id) === t);
      if (found) {
        setStateCode(found.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateList]);

  // fetch districts when state changes
  useEffect(() => {
    const stateCode = local.StateCode;
    if (!stateCode) {
      setDistrictList([]);
      return;
    }

    // If server supplied initialDistricts and they match, use them
    if (Array.isArray(initialDistricts) && initialDistricts.length > 0 && initialDistricts[0].state_id) {
      const match = initialDistricts.filter((d) => String(d.state_id) === String(stateCode));
      if (match.length > 0) {
        setDistrictList(match.slice());
        return;
      }
    }

    setLoadingDistricts(true);
    setDistrictList([]);
    fetch(`/api/districts?stateId=${encodeURIComponent(stateCode)}`)
      .then((r) => r.json())
      .then((j) => {
        console.log("DEBUG /api/districts for", stateCode, "->", j);
        if (j?.ok && Array.isArray(j.districts)) setDistrictList(j.districts);
        else if (Array.isArray(j)) setDistrictList(j as DistrictItem[]);
        else {
          console.warn("/api/districts unexpected", j);
          setDistrictList([]);
        }
      })
      .catch((e) => {
        console.warn("fetch /api/districts failed", e);
        setDistrictList([]);
      })
      .finally(() => setLoadingDistricts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.StateCode, initialDistricts]);

  // when districtList changes, try to preselect district aggressively (if not set)
  useEffect(() => {
    if (!districtList || districtList.length === 0) return;
    if (local.DistrictCode) return; // user already has a value

    // possible values to match from restro row
    const possible = initialData?.DistrictCode ?? initialData?.District ?? initialData?.DistrictName ?? initialData?.Districts ?? "";
    if (!possible) return;

    const targetRaw = String(possible).trim();
    const targetNorm = normalizeText(targetRaw);

    // 1: try direct id/code match
    let found = districtList.find((d) => String(d.id) === targetRaw || String((d as any).DistrictCode) === targetRaw);
    if (found) {
      setLocal((s: any) => ({ ...s, DistrictCode: String(found.id) }));
      return;
    }

    // 2: try exact normalized name
    found = districtList.find((d) => normalizeText(d.name) === targetNorm || normalizeText((d as any).DistrictName ?? "") === targetNorm);
    if (found) {
      setLocal((s: any) => ({ ...s, DistrictCode: String(found.id) }));
      return;
    }

    // 3: fuzzy contains
    found = districtList.find((d) => normalizeText(d.name).includes(targetNorm) || targetNorm.includes(normalizeText(d.name)));
    if (found) {
      setLocal((s: any) => ({ ...s, DistrictCode: String(found.id) }));
      return;
    }

    // 4: token intersection (handle partial tokens)
    const tokens = targetNorm.split(/[\s\-_.,]+/).filter(Boolean);
    if (tokens.length > 0) {
      const tokenMatch = districtList.find((d) => {
        const nm = normalizeText(d.name);
        return tokens.every((t) => nm.includes(t));
      });
      if (tokenMatch) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(tokenMatch.id) }));
        return;
      }
    }

    // nothing matched — leave empty
    // console.log("No district auto-match for", possible, "in list", districtList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtList, initialData]);

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
          <div>
            <select
              value={local.StateCode ?? ""}
              onChange={(e) => {
                const v = e.target.value;
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
            <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
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
