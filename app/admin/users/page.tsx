// app/admin/users/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";
import AdminPage from "@/components/admin/AdminPage";
import AdminToolbar from "@/components/admin/AdminToolbar";

type User = {
  id: string;
  user_id?: string | null;
  user_type: string;
  name: string;
  mobile: string;
  photo_url?: string | null;
  dob?: string | null;
  email?: string | null;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
  seq?: number;
};

const modalStyle = {
  content: {
    maxWidth: "720px",
    margin: "auto",
    inset: "10% auto auto auto",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  overlay: { backgroundColor: "rgba(15,23,42,0.45)", zIndex: 2000 },
};

const addModalStyle = {
  ...modalStyle,
  content: {
    ...modalStyle.content,
    maxWidth: "560px",
  },
};

function redirectToLogin() {
  try {
    window.location.replace("/admin/login");
  } catch {
    window.location.href = "/admin/login";
  }
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const el = document.getElementById("__next");
      Modal.setAppElement(el || document.body);
    } catch (err) {
      console.warn("Modal.setAppElement failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);

      if (filterType && filterType !== "All") {
        params.set("user_type", filterType);
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to fetch users");

      const data = (json.users || []).map((u: User) => ({ ...u }));
      setUsers(data);
    } catch (err) {
      console.error("fetchUsers error:", err);
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(u: User) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: !u.status }),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to update status");
      fetchUsers();
    } catch (err: any) {
      alert("Failed to change status: " + (err.message || err));
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.key === "Enter") fetchUsers();
  }

  return (
    <AdminPage
      title="Users Management"
      subtitle="Manage admin users, access roles, photos, and active status"
      actions={
        <AdminButton variant="success" onClick={() => setIsAddOpen(true)}>
          Add New User
        </AdminButton>
      }
    >
      <AdminToolbar
        actions={
          <AdminButton onClick={() => fetchUsers()}>
            Search
          </AdminButton>
        }
      >
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <AdminInput
            placeholder="Search by name or mobile..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <AdminSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          >
            <option>All</option>
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Support</option>
          </AdminSelect>
        </div>
      </AdminToolbar>

      <AdminCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-3">{u.seq ?? i + 1}</td>
                    <td className="px-4 py-3">
                      {u.user_id ?? (u.seq != null ? String(u.seq) : u.id)}
                    </td>
                    <td className="px-4 py-3">{u.user_type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3">{u.mobile}</td>
                    <td className="px-4 py-3">
                      {u.photo_url ? (
                        <img
                          src={u.photo_url}
                          alt="photo"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          NA
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{u.dob ?? ""}</td>
                    <td className="px-4 py-3">{u.email ?? ""}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleStatus(u)}
                        className={[
                          "relative h-6 w-12 rounded-full transition",
                          u.status ? "bg-emerald-500" : "bg-slate-400",
                        ].join(" ")}
                        aria-label="toggle status"
                      >
                        <span
                          className={[
                            "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                            u.status ? "left-7" : "left-1",
                          ].join(" ")}
                        />
                      </button>
                      <span className="ml-2 font-semibold">
                        {u.status ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">{formatDate(u.updated_at)}</td>
                    <td className="px-4 py-3">
                      <AdminButton
                        variant="secondary"
                        className="h-9 px-3"
                        onClick={() => setEditUser(u)}
                        title="Edit"
                      >
                        Edit
                      </AdminButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <Modal
        isOpen={!!editUser}
        onRequestClose={() => setEditUser(null)}
        style={modalStyle}
      >
        {editUser && (
          <EditUserForm
            user={editUser}
            onClose={(refresh) => {
              setEditUser(null);
              if (refresh) fetchUsers();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isAddOpen}
        onRequestClose={() => setIsAddOpen(false)}
        style={addModalStyle}
      >
        <AddUserForm
          onClose={(refresh) => {
            setIsAddOpen(false);
            if (refresh) fetchUsers();
          }}
          existingCount={users.length}
        />
      </Modal>
    </AdminPage>
  );
}

function EditUserForm({
  user,
  onClose,
}: {
  user: User;
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: user.name || "",
    user_type: user.user_type || "Super Admin",
    mobile: user.mobile || "",
    password: "",
    status: user.status,
    email: user.email || "",
    dob: user.dob || "",
  });
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo_url ?? null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    setPhotoPreview(user.photo_url ?? null);
  }, [photoFile, user.photo_url]);

  function validate() {
    if (!form.name || !/^[A-Za-z\s]+$/.test(form.name.trim())) {
      alert("Name required and should contain only letters and spaces.");
      return false;
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      alert("Mobile must be exactly 10 digits.");
      return false;
    }

    if (!form.email || !(form.email.includes("@") && form.email.includes(".com"))) {
      alert("Enter a valid email containing '@' and '.com'.");
      return false;
    }

    return true;
  }

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append("file", photoFile);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Photo upload failed");
    return json.url ?? null;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const photo_url = await uploadPhotoIfAny();

      const payload: any = {
        name: form.name.trim(),
        user_type: form.user_type,
        mobile: form.mobile,
        status: form.status,
        email: form.email.trim() || null,
        dob: form.dob || null,
      };

      if (form.password) payload.password = form.password;
      if (photo_url) payload.photo_url = photo_url;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed");
      alert("User updated!");
      onClose(true);
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Edit User</h2>
      <div className="grid gap-3">
        <AdminField label="Name">
          <AdminInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
          />
        </AdminField>

        <AdminField label="Mobile">
          <AdminInput
            value={form.mobile}
            onChange={(e) =>
              setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
            }
            placeholder="Mobile"
            inputMode="numeric"
          />
        </AdminField>

        <AdminField label="User Type">
          <AdminSelect
            value={form.user_type}
            onChange={(e) => setForm({ ...form, user_type: e.target.value })}
          >
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Support</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Email">
          <AdminInput
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            autoComplete="off"
          />
        </AdminField>

        <AdminField label="DOB">
          <AdminInput
            type="date"
            value={form.dob ?? ""}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
        </AdminField>

        <AdminField label="New Password">
          <div className="flex gap-2">
            <AdminInput
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="New Password (optional)"
              autoComplete="new-password"
            />
            <AdminButton
              variant="secondary"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </AdminButton>
          </div>
        </AdminField>

        <AdminField label="Photo">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) setPhotoFile(f);
            }}
          />
          {photoPreview ? (
            <div className="mt-2">
              <img src={photoPreview} alt="preview" className="h-20 w-20 rounded object-cover" />
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-red-600"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : null}
        </AdminField>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.checked })}
          />
          Active
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <AdminButton variant="secondary" onClick={() => onClose(false)}>
          Cancel
        </AdminButton>
        <AdminButton disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save"}
        </AdminButton>
      </div>
    </div>
  );
}

function AddUserForm({
  onClose,
  existingCount,
}: {
  onClose: (refresh: boolean) => void;
  existingCount: number;
}) {
  const [form, setForm] = useState({
    name: "",
    user_type: "Super Admin",
    mobile: "",
    password: "",
    email: "",
    dob: "",
  });
  const [saving, setSaving] = useState(false);
  const [nextIdLoading, setNextIdLoading] = useState(false);
  const [suggestedSeq, setSuggestedSeq] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    (async () => {
      setNextIdLoading(true);
      try {
        const res = await fetch("/api/admin/users/next-id", { credentials: "include" });
        if (res.status === 401) {
          redirectToLogin();
          return;
        }
        if (!res.ok) throw new Error("no endpoint");
        const json = await res.json().catch(() => ({}));
        if (json?.nextId) setSuggestedSeq(json.nextId);
        else setSuggestedSeq(existingCount + 1);
      } catch {
        setSuggestedSeq(existingCount + 1);
      } finally {
        setNextIdLoading(false);
      }
    })();
  }, [existingCount]);

  function validate() {
    if (!form.name || !/^[A-Za-z\s]+$/.test(form.name.trim())) {
      alert("Name required and should contain only letters and spaces.");
      return false;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      alert("Mobile must be exactly 10 digits.");
      return false;
    }
    if (!form.email || !(form.email.includes("@") && form.email.includes(".com"))) {
      alert("Enter a valid email containing '@' and '.com'.");
      return false;
    }
    if (!form.password) {
      alert("Password required.");
      return false;
    }
    return true;
  }

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append("file", photoFile);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Photo upload failed");
    return json.url ?? null;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSaving(true);
    try {
      const photo_url = await uploadPhotoIfAny();

      const payload: any = {
        name: form.name.trim(),
        user_type: form.user_type,
        mobile: form.mobile,
        password: form.password,
        email: form.email.trim() || null,
        dob: form.dob || null,
        photo_url: photo_url ?? null,
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed");
      alert("User added!");
      onClose(true);
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Add New User</h2>
      <div className="grid gap-3">
        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
          Suggested numeric id: {nextIdLoading ? "..." : suggestedSeq ?? existingCount + 1}
        </div>

        <AdminField label="Name">
          <AdminInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            autoComplete="name"
          />
        </AdminField>

        <AdminField label="Mobile">
          <AdminInput
            value={form.mobile}
            onChange={(e) =>
              setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
            }
            placeholder="Mobile (10 digits)"
            inputMode="numeric"
          />
        </AdminField>

        <AdminField label="User Type">
          <AdminSelect
            value={form.user_type}
            onChange={(e) => setForm({ ...form, user_type: e.target.value })}
          >
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Support</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Email">
          <AdminInput
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            autoComplete="off"
          />
        </AdminField>

        <AdminField label="DOB">
          <AdminInput
            type="date"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
        </AdminField>

        <AdminField label="Password">
          <div className="flex gap-2">
            <AdminInput
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              autoComplete="new-password"
            />
            <AdminButton
              variant="secondary"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </AdminButton>
          </div>
        </AdminField>

        <AdminField label="Photo">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) setPhotoFile(f);
            }}
          />
          {photoPreview ? (
            <div className="mt-2">
              <img src={photoPreview} alt="preview" className="h-20 w-20 rounded object-cover" />
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-red-600"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : null}
        </AdminField>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <AdminButton variant="secondary" onClick={() => onClose(false)}>
          Cancel
        </AdminButton>
        <AdminButton variant="success" disabled={saving} onClick={handleAdd}>
          {saving ? "Adding..." : "Add User"}
        </AdminButton>
      </div>
    </div>
  );
}
