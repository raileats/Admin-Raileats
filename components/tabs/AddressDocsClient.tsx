// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type StateItem = { id: string; name: string };
type DistrictItem = { id: string; name: string; state_id?: string };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[];
  initialDistricts?: DistrictItem[];
};

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

  // refs for guarding duplicate/overlapping fetches
  const lastFetchedStateRef = useRef<string | null>(null);
  const ongoingFetchRef = useRef<AbortController | null>(null);
  const failedStatesRef = useRef<Set<string>>(new Set()); // cache failed stateIds so we don't retry repeatedly

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
        console.log("DEBUG /api/states ->", j);
        if (j?.ok && Array.isArray(j.states)) setStateList(j.states);
        else if (Array.isArray(j)) setStateList(j as StateItem[]);
        else console.warn("Unexpected /api/states response", j);
      })
      .catch((e) => console.warn("fetch /api/states failed", e))
      .finally(() => setLoadingStates(false));
  }, [states]);

  // sync when initialData changes
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
  }, [initialData]);

  // normalize StateCode when stateList arrives (tries to match by name if code not present)
  useEffect(() => {
    if (!stateList || stateList.length === 0) return;

    const cur = local.StateCode;
    const setStateCodeById = (idVal: string) => {
      setLocal((s: any) => ({ ...s, StateCode: idVal, DistrictCode: "" }));
    };

    if (!cur) {
      const nameFromInitial = initialData?.StateName ?? initialData?.State;
      if (nameFromInitial) {
        const target = String(nameFromInitial).trim().toLowerCase();
        const exact = stateList.find((s) => String(s.name).trim().toLowerCase() === target);
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

    const byId = stateList.find((s) => String(s.id) === String(cur));
    if (!byId) {
      const target = String(cur).trim().toLowerCase();
      const foundByName = stateList.find((s) => String(s.name).trim().toLowerCase() === target);
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

  // When StateCode changes -> load districts (with robust guards)
  useEffect(() => {
    const stateCode = local.StateCode;
    if (!stateCode) {
      setDistrictList([]);
      lastFetchedStateRef.current = null;
      return;
    }

    // If we were given initialDistricts from server and they match, use them
    if (Array.isArray(initialDistricts) && initialDistricts.length > 0 && initialDistricts[0].state_id) {
      const matchInit = initialDistricts.filter((d) => String(d.state_id) === String(stateCode));
      if (matchInit.length > 0) {
        setDistrictList(matchInit.slice());
        tryPreselectDistrict(matchInit);
        lastFetchedStateRef.current = String(stateCode);
        return;
      }
    }

    // If this state previously failed network fetch, avoid retrying repeatedly
    if (failedStatesRef.current.has(String(stateCode))) {
      console.warn("Skipping districts fetch for state (previously failed):", stateCode);
      setDistrictList([]);
      setLoadingDistricts(false);
      return;
    }

    // avoid duplicate fetch if already fetched for same state
    if (String(lastFetchedStateRef.current) === String(stateCode)) {
      return;
    }

    // abort any ongoing fetch
    if (ongoingFetchRef.current) {
      ongoingFetchRef.current.abort();
      ongoingFetchRef.current = null;
    }

    const ac = new AbortController();
    ongoingFetchRef.current = ac;
    lastFetchedStateRef.current = String(stateCode);

    setLoadingDistricts(true);
    setDistrictList([]);

    (async () => {
      try {
        // find stateName from stateList matching this stateCode (if available)
        const matchedState = stateList.find((s) => String(s.id) === String(stateCode));
        const stateNameForApi = matchedState ? matchedState.name : "";

        // send both stateId and state (name) to API to increase chances of server-side match
        const url = `/api/districts?stateId=${encodeURIComponent(stateCode)}${stateNameForApi ? `&state=${encodeURIComponent(stateNameForApi)}` : ""}`;

        const resp = await fetch(url, { signal: ac.signal, cache: "no-store" });

        // parse JSON safely
        const body = await resp.json().catch((e) => {
          console.warn("Failed to parse JSON from /api/districts", e);
          return null;
        });

        console.log("DEBUG /api/districts", { url, status: resp.status, ok: resp.ok, body });

        if (ac.signal.aborted) {
          console.log("district fetch aborted for", stateCode);
          return;
        }

        // handle various shapes (our API returns {ok:true,districts:[]})
        let list: any[] = [];
        if (resp.ok && body?.ok && Array.isArray(body.districts)) {
          list = body.districts;
        } else if (Array.isArray(body)) {
          list = body as any[];
        } else if (body && Array.isArray(body?.result)) {
          list = body.result;
        } else if (body && Array.isArray(body?.districts)) {
          list = body.districts;
        } else {
          console.warn("Unexpected /api/districts response shape or non-ok status", { status: resp.status, body });
        }

        if (list && list.length > 0) {
          // normalize each item to have {id,name,state_id}
          const normalized = list.map((r: any) => ({
            id: String(r?.id ?? r?.DistrictCode ?? r?.districtcode ?? r?.DistrictCode ?? r?.DistrictId ?? ""),
            name: String(r?.name ?? r?.DistrictName ?? r?.districtname ?? r?.District ?? r?.district ?? ""),
            state_id: String(r?.state_id ?? r?.StateCode ?? r?.statecode ?? r?.StateName ?? r?.statename ?? ""),
          }));
          setDistrictList(normalized);
          tryPreselectDistrict(normalized);
        } else {
          // mark this state as failed so we won't hammer it repeatedly
          failedStatesRef.current.add(String(stateCode));
          setDistrictList([]);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("district fetch aborted by new request");
        } else {
          console.warn("fetch /api/districts failed:", err);
          // if network error, avoid continuous retry - add to failed set
          failedStatesRef.current.add(String(stateCode));
          setDistrictList([]);
        }
      } finally {
        setLoadingDistricts(false);
        ongoingFetchRef.current = null;
      }
    })();

    function tryPreselectDistrict(list: DistrictItem[]) {
      // 1) if local.DistrictCode already matches an id in list, keep it
      if (local.DistrictCode) {
        const existsById = list.find((d) => String(d.id) === String(local.DistrictCode));
        if (existsById) return;
      }

      // 2) find possible values from initialData (try multiple keys)
      const possible =
        initialData?.DistrictCode ??
        initialData?.District ??
        initialData?.DistrictName ??
        initialData?.Districts ??
        local.DistrictCode ??
        null;
      if (!possible) return;

      const targetRaw = String(possible).trim();
      const targetLower = targetRaw.toLowerCase();

      // 3) If possible looks like an id (numeric or exact match), try id match first
      const byId = list.find((d) => String(d.id) === targetRaw || String((d as any).DistrictCode) === targetRaw);
      if (byId) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(byId.id) }));
        return;
      }

      // 4) Exact name match (case-insensitive)
      const foundByName = list.find((d) => String(d.name).trim().toLowerCase() === targetLower || String((d as any).DistrictName ?? "").trim().toLowerCase() === targetLower);
      if (foundByName) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(foundByName.id) }));
        return;
      }

      // 5) Fuzzy contains / tokens
      const fuzzy = list.find((d) => String(d.name).toLowerCase().includes(targetLower) || targetLower.includes(String(d.name).toLowerCase()));
      if (fuzzy) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(fuzzy.id) }));
        return;
      }

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

      // 6) If the initial value was a name but didn't match, try matching by partial tokens in DistrictName property as well
      const altMatch = list.find((d) => {
        const alt = String((d as any).DistrictName ?? "").toLowerCase();
        return (alt && (targetLower.includes(alt) || alt.includes(targetLower)));
      });
      if (altMatch) {
        setLocal((s: any) => ({ ...s, DistrictCode: String(altMatch.id) }));
        return;
      }
    }

    // cleanup
    return () => {
      if (ongoingFetchRef.current) {
        ongoingFetchRef.current.abort();
        ongoingFetchRef.current = null;
      }
    };
  }, [local.StateCode, initialDistricts, initialData, stateList]);

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

      {/* ---------- DEBUG PANEL (temporary) ---------- */}
      <div style={{ marginTop: 12, background: "#fff8e6", padding: 12, borderRadius: 6 }}>
        <strong>DEBUG</strong>
        <div>
          <strong>local.StateCode:</strong> {String(local.StateCode ?? "")}
        </div>
        <div>
          <strong>resolved state name (from stateList):</strong>{" "}
          {stateList.find((s) => String(s.id) === String(local.StateCode))?.name ?? "(none)"}
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>districtList (count):</strong> {districtList.length}
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto", background: "#fff", padding: 8 }}>
            {JSON.stringify(districtList.slice(0, 40), null, 2)}
          </pre>
        </div>
      </div>
      {/* --------------------------------------------- */}

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
