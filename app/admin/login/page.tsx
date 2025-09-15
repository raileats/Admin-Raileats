// app/admin/login/page.tsx
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
        body: JSON.stringify({ phone, password })
      });

      if (res.ok) {
        // server set cookie; now navigate
        router.replace("/admin/home");
      } else {
        const j = await res.json().catch(()=>({}));
        alert(j?.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width:360, padding:24, background:"#fff", borderRadius:8 }}>
      <h2 style={{ textAlign:"center" }}>Admin Login</h2>
      <label>User ID (mobile)</label>
      <input value={phone} onChange={(e)=>setPhone(e.target.value)} required style={{ width:"100%", padding:8, marginBottom:12 }} />
      <label>Password</label>
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:"100%", padding:8, marginBottom:16 }} />
      <button type="submit" disabled={loading} style={{ width:"100%", padding:10 }}>
        {loading ? "Logging..." : "Log in"}
      </button>
    </form>
  );
}
