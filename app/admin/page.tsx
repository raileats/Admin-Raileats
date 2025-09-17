"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminStationsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const session = supabase.auth.getSession().then((r) => r.data.session);
    // subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchStations();
    });

    // check initial signed-in user
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function signIn(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else {
      // fetchStations will be called by auth change
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStations([]);
    setUser(null);
  }

  async function fetchStations() {
    setLoading(true);
    const { data, error } = await supabase.from("Stations").select(`StationId, StationName, StationCode, Category, Division, RailwayZone, District, State, Lat, Long, Address`).limit(1000);
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setStations(data || []);
    }
  }

  async function updateStation(id, updates) {
    setErrorMsg("");
    const { data, error } = await supabase.from("Stations").update(updates).eq("StationId", id).select();
    if (error) setErrorMsg(error.message);
    else {
      // reflect changes locally
      setStations((s) => s.map((r) => (r.StationId === id ? { ...r, ...updates } : r)));
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
          {errorMsg && <div className="mb-3 text-red-600">{errorMsg}</div>}
          <form onSubmit={signIn}>
            <label className="block text-sm font-medium">Email</label>
            <input className="w-full border rounded px-3 py-2 mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="block text-sm font-medium">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2 mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Stations — Admin</h1>
          <div className="flex gap-2 items-center">
            <div className="text-sm">{user.email}</div>
            <button className="px-3 py-1 border rounded" onClick={signOut}>Sign out</button>
          </div>
        </div>

        <div className="mb-4">
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={fetchStations}>Reload Stations</button>
        </div>

        {errorMsg && <div className="mb-3 text-red-600">{errorMsg}</div>}
        {loading && <div className="mb-3">Loading…</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Code</th>
                <th className="p-2">Category</th>
                <th className="p-2">Division</th>
                <th className="p-2">State</th>
                <th className="p-2">Lat</th>
                <th className="p-2">Long</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((st) => (
                <EditableRow key={st.StationId} station={st} onSave={updateStation} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditableRow({ station, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    StationName: station.StationName || "",
    Category: station.Category || "",
    Division: station.Division || "",
    State: station.State || "",
    Lat: station.Lat || "",
    Long: station.Long || "",
  });

  useEffect(() => {
    setForm({
      StationName: station.StationName || "",
      Category: station.Category || "",
      Division: station.Division || "",
      State: station.State || "",
      Lat: station.Lat || "",
      Long: station.Long || "",
    });
  }, [station]);

  return (
    <tr className="border-t">
      <td className="p-2 align-top text-sm">{station.StationId}</td>
      <td className="p-2 align-top">
        {editing ? (
          <input value={form.StationName} onChange={(e) => setForm(f => ({...f, StationName: e.target.value}))} className="w-64 border rounded px-2 py-1" />
        ) : (
          <div className="text-sm">{station.StationName}</div>
        )}
      </td>
      <td className="p-2 align-top text-sm">{station.StationCode}</td>
      <td className="p-2 align-top">
        {editing ? (
          <input value={form.Category} onChange={(e) => setForm(f => ({...f, Category: e.target.value}))} className="w-24 border rounded px-2 py-1" />
        ) : station.Category}
      </td>
      <td className="p-2 align-top">
        {editing ? (
          <input value={form.Division} onChange={(e) => setForm(f => ({...f, Division: e.target.value}))} className="w-36 border rounded px-2 py-1" />
        ) : station.Division}
      </td>
      <td className="p-2 align-top">
        {editing ? (
          <input value={form.State} onChange={(e) => setForm(f => ({...f, State: e.target.value}))} className="w-36 border rounded px-2 py-1" />
        ) : station.State}
      </td>
      <td className="p-2 align-top">
        {editing ? (
          <input value={form.Lat} onChange={(e) => setForm(f => ({...f, Lat: e.target.value}))} className="w-24 border rounded px-2 py-1" />
        ) : station.Lat}
      </td>
      <td className="p-2 align-top">
        {editing ? (
          <input value={form.Long} onChange={(e) => setForm(f => ({...f, Long: e.target.value}))} className="w-24 border rounded px-2 py-1" />
        ) : station.Long}
      </td>
      <td className="p-2 align-top">
        {editing ? (
          <div className="flex gap-2">
            <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => { onSave(station.StationId, {
              StationName: form.StationName,
              Category: form.Category,
              Division: form.Division,
              State: form.State,
              Lat: form.Lat || null,
              Long: form.Long || null
            }); setEditing(false); }}>Save</button>
            <button className="px-2 py-1 border rounded" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="px-2 py-1 border rounded" onClick={() => setEditing(true)}>Edit</button>
          </div>
        )}
      </td>
    </tr>
  );
}
