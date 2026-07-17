"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Row = {
  Id: number | string; RequestNo: string | null; RestroCode: number | string;
  RestroName: string | null; RequestDateFormatted: string | null; Amount: number;
  CurrentBalance: number; AvailableBalanceBeforeRequest: number; Status: string;
  VendorRemarks: string | null; AdminRemarks: string | null; UTR: string | null;
};
type Action = "APPROVE" | "REJECT" | "PAID";

function money(v: unknown) {
  const n = Number(v);
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function statusClass(s: string) {
  if (s === "Paid") return "bg-emerald-100 text-emerald-800";
  if (s === "Approved") return "bg-blue-100 text-blue-800";
  if (s === "Rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}
function today() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); }

export default function SettlementRequestsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [remarks, setRemarks] = useState("");
  const [utr, setUtr] = useState("");
  const [paidDate, setPaidDate] = useState(today());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (status) q.set("status", status);
      if (search) q.set("search", search);
      const res = await fetch(`/api/admin/settlement-requests?${q}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Unable to load requests");
      setRows(json.rows || []); setTotal(json.total || 0); setTotalPages(json.totalPages || 1);
    } catch (e: any) { setRows([]); setError(e?.message || "Unable to load requests"); }
    finally { setLoading(false); }
  }, [page, pageSize, search, status]);

  useEffect(() => { load(); }, [load]);

  function doSearch(e: FormEvent) { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }
  function open(row: Row, nextAction: Action | null) {
    setSelected(row); setAction(nextAction); setRemarks(""); setUtr(""); setPaidDate(today()); setError("");
  }
  function close() { if (!saving) { setSelected(null); setAction(null); } }

  async function submit() {
    if (!selected || !action) return;
    if (action === "REJECT" && !remarks.trim()) return setError("Rejection reason is required");
    if (action === "PAID" && !utr.trim()) return setError("UTR number is required");
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/settlement-requests", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: selected.Id, action, adminRemarks: remarks, utr, paidDate }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Unable to update request");
      setSuccess(json.message || "Request updated"); setSelected(null); setAction(null); await load();
    } catch (e: any) { setError(e?.message || "Unable to update request"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4">
      {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      {success && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_110px]">
        <form onSubmit={doSearch} className="flex gap-2">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Request No, Restro Code, Name or UTR" className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm" />
          <button className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-black text-white">Search</button>
        </form>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-xl border bg-white px-3 text-sm font-bold">
          <option value="">All Status</option><option>Pending</option><option>Approved</option><option>Paid</option><option>Rejected</option>
        </select>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-10 rounded-xl border bg-white px-3 text-sm font-bold">
          {[20,50,100,500].map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="min-w-[1000px] w-full text-left">
          <thead className="bg-slate-50"><tr>{["Request","Restaurant","Amount","Balance","Status","Date","Actions"].map(x => <th key={x} className="border-b px-3 py-3 text-[10px] font-black uppercase text-slate-500">{x}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="py-14 text-center font-bold text-slate-400">Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="py-14 text-center font-bold text-slate-400">No settlement request found</td></tr> : rows.map(row => (
              <tr key={String(row.Id)} className="border-b align-top">
                <td className="px-3 py-3"><button onClick={() => open(row, null)} className="text-xs font-black text-blue-700">{row.RequestNo || `#${row.Id}`}</button></td>
                <td className="px-3 py-3 text-xs font-black">{row.RestroCode} / {row.RestroName || "-"}</td>
                <td className="px-3 py-3 text-sm font-black">₹{money(row.Amount)}</td>
                <td className="px-3 py-3 text-xs"><b>Current ₹{money(row.CurrentBalance)}</b><div className="mt-1 text-slate-400">Available ₹{money(row.AvailableBalanceBeforeRequest)}</div></td>
                <td className="px-3 py-3"><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${statusClass(row.Status)}`}>{row.Status}</span></td>
                <td className="px-3 py-3 text-xs text-slate-500">{row.RequestDateFormatted || "-"}</td>
                <td className="px-3 py-3"><div className="flex flex-wrap gap-2">
                  {row.Status === "Pending" && <><button onClick={() => open(row,"APPROVE")} className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black text-white">Approve</button><button onClick={() => open(row,"REJECT")} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white">Reject</button></>}
                  {row.Status === "Approved" && <><button onClick={() => open(row,"PAID")} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white">Mark Paid</button><button onClick={() => open(row,"REJECT")} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white">Reject</button></>}
                  <button onClick={() => open(row,null)} className="rounded-lg border px-3 py-2 text-[10px] font-black">View</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between"><div className="text-xs font-bold text-slate-500">Total {total} • Page {page} of {totalPages}</div><div className="flex gap-2"><button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40">Previous</button><button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40">Next</button></div></div>

      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex justify-between border-b bg-white px-5 py-4"><div><h2 className="text-lg font-black">{action === "APPROVE" ? "Approve Settlement" : action === "REJECT" ? "Reject Settlement" : action === "PAID" ? "Mark Settlement Paid" : "Settlement Details"}</h2><p className="text-xs font-bold text-blue-700">{selected.RequestNo}</p></div><button onClick={close} className="rounded-lg border px-3 py-2 text-xs font-black">Close</button></div>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><small>Restaurant</small><div className="font-black">{selected.RestroCode} / {selected.RestroName}</div></div><div className="rounded-xl bg-emerald-50 p-3"><small>Requested Amount</small><div className="text-lg font-black text-emerald-700">₹{money(selected.Amount)}</div></div></div>
          <div className="rounded-xl border p-3 text-sm"><div><b>Status:</b> {selected.Status}</div><div className="mt-2"><b>Vendor Remarks:</b> {selected.VendorRemarks || "-"}</div><div className="mt-2"><b>Admin Remarks:</b> {selected.AdminRemarks || "-"}</div><div className="mt-2"><b>UTR:</b> {selected.UTR || "-"}</div></div>
          {action && <textarea value={remarks} onChange={e=>setRemarks(e.target.value.slice(0,500))} rows={3} placeholder={action==="REJECT" ? "Rejection reason *" : "Optional admin remarks"} className="w-full rounded-xl border px-3 py-3 text-sm" />}
          {action === "PAID" && <div className="grid gap-3 sm:grid-cols-2"><input value={utr} onChange={e=>setUtr(e.target.value)} placeholder="UTR Number *" className="h-10 rounded-xl border px-3 text-sm font-bold"/><input type="date" value={paidDate} onChange={e=>setPaidDate(e.target.value)} className="h-10 rounded-xl border px-3 text-sm font-bold"/></div>}
          {action && <button onClick={submit} disabled={saving} className={`h-11 w-full rounded-xl text-sm font-black text-white disabled:opacity-50 ${action==="APPROVE" ? "bg-blue-600" : action==="REJECT" ? "bg-red-600" : "bg-emerald-600"}`}>{saving ? "Saving..." : action==="APPROVE" ? "Confirm Approve" : action==="REJECT" ? "Confirm Reject" : "Confirm Mark Paid"}</button>}
        </div>
      </div></div>}
    </div>
  );
}
