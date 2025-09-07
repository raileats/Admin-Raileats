"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      // Debug: if server responded with Set-Cookie, it will be in headers
      if (res.ok) {
        // navigation after server set cookie
        router.replace("/admin/home");
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json?.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: 360, padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center" }}>Admin Login</h2>

      <label style={{ display: "block", marginTop: 12 }}>User ID (mobile)</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8799726485" required style={{ width: "100%", padding: 8, marginTop: 6 }} />

      <label style={{ display: "block", marginTop: 12 }}>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" required style={{ width: "100%", padding: 8, marginTop: 6 }} />

      <button type="submit" disabled={loading} style={{ marginTop: 16, width: "100%", padding: 10, background: "#273e9a", color: "#fff", border: "none", borderRadius: 4 }}>
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
