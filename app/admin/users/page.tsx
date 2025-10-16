// app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";

Modal.setAppElement?.("#__next" as any);

type User = {
  id: string; // original uuid kept for API ops
  seq?: number; // numeric sequence (optional)
  user_type: string;
  name: string;
  mobile: string;
  photo_url?: string | null;
  status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("Super Admin");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filterType]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterType) params.set("user_type", filterType);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed");
      }
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(u: User) {
    try {
      // optimistic UI optional: don't do it here to keep in-sync with server
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !u.status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.message || "Failed");
      }
      fetchUsers();
    } catch (err:any) {
      alert("Failed to change status: " + (err.message||err));
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-md hover:shadow"
        >
          Add New User
        </button>
      </div>

      <div className="flex gap-3 mb-6 items-center">
        <input
          placeholder="Search by name or mobile"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded"
        >
          <option>Super Admin</option>
          <option>Admin</option>
          <option>Support</option>
        </select>
        <button
          onClick={() => fetchUsers()}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-lg shadow ring-1 ring-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">User ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Mobile</th>
              <th>Photo</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Password</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center p-6">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-6">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {u.seq ?? idx + 1}
                  </td>
                  <td className="px-6 py-4 text-sm break-all">{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.user_type}</td>
                  <td>{u.mobile}</td>
                  <td className="px-2">
                    {u.photo_url ? (
                      <img
                        src={u.photo_url}
                        alt="photo"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        NA
                      </div>
                    )}
                  </td>
                  <td className="text-sm">
                    {u.created_at && new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="text-sm">
                    {u.updated_at && new Date(u.updated_at).toLocaleString()}
                  </td>

                  <td>
                    <button
                      onClick={() => setEditUser(u)}
                      title="Edit"
                      className="p-1"
                    >
                      {/* pencil icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5l3 3L13 14l-3.5.5L13 10l5.5-7.5z" />
                      </svg>
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={u.status}
                        onChange={() => toggleStatus(u)}
                        className="sr-only"
                      />
                      <span
                        className={`w-12 h-6 inline-block rounded-full transition-colors ${u.status ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      <span className="ml-2 text-sm">{u.status ? "Active" : "Blocked"}</span>
                    </label>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => setEditUser(u)}
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUser}
        onRequestClose={() => setEditUser(null)}
        className="max-w-2xl mx-auto mt-20 bg-white p-6 rounded shadow"
        overlayClassName="fixed inset-0 bg-black/30 flex items-start justify-center"
      >
        {editUser && <EditUserForm user={editUser} onClose={(r)=>{ setEditUser(null); if(r) fetchUsers(); }} />}
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onRequestClose={() => setIsAddOpen(false)}
        className="max-w-xl mx-auto mt-20 bg-white p-6 rounded shadow"
        overlayClassName="fixed inset-0 bg-black/30 flex items-start justify-center"
      >
        <AddUserForm onClose={(r)=>{ setIsAddOpen(false); if(r) fetchUsers(); }} />
      </Modal>
    </div>
  );
}

/* ---------------------- Sub Components ---------------------- */

function EditUserForm({ user, onClose }: { user: any; onClose: (r:boolean)=>void }) {
  const [form, setForm] = useState({
    name: user.name||"",
    user_type: user.user_type||"Super Admin",
    mobile: user.mobile||"",
    password: "",
    status: !!user.status,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.message || "Failed");
      }
      onClose(true);
    } catch (err:any) {
      alert("Error: " + (err.message||err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Edit User (#{user.seq ?? "-"})</h2>
      <div className="flex flex-col gap-3">
        <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="border p-2 rounded" placeholder="Name" />
        <input value={form.mobile} onChange={(e)=>setForm({...form, mobile:e.target.value})} className="border p-2 rounded" placeholder="Mobile" />
        <select value={form.user_type} onChange={(e)=>setForm({...form, user_type:e.target.value})} className="border p-2 rounded">
          <option>Super Admin</option>
          <option>Admin</option>
          <option>Support</option>
        </select>
        <input type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="border p-2 rounded" placeholder="New Password (optional)" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.status} onChange={(e)=>setForm({...form, status:e.target.checked})} />
          Active
        </label>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={()=>onClose(false)}>Cancel</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</button>
      </div>
    </div>
  );
}

function AddUserForm({ onClose }: { onClose: (r:boolean)=>void }) {
  const [form, setForm] = useState({ name:"", user_type:"Super Admin", mobile:"", password:"" });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if(!form.name || !form.password){ alert("Name and Password required!"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      if(!res.ok){
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.message || "Failed");
      }
      onClose(true);
    } catch (err:any){
      alert("Error: " + (err.message||err));
    } finally { setSaving(false); }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Add New User</h2>
      <div className="flex flex-col gap-3">
        <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="border p-2 rounded" placeholder="Name" />
        <input value={form.mobile} onChange={(e)=>setForm({...form, mobile:e.target.value})} className="border p-2 rounded" placeholder="Mobile" />
        <select value={form.user_type} onChange={(e)=>setForm({...form, user_type:e.target.value})} className="border p-2 rounded">
          <option>Super Admin</option><option>Admin</option><option>Support</option>
        </select>
        <input type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="border p-2 rounded" placeholder="Password" />
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={()=>onClose(false)}>Cancel</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving} onClick={handleAdd}>{saving?"Adding...":"Add User"}</button>
      </div>
    </div>
  );
}
