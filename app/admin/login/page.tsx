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

      const j = await res.json().catch(()=>({}));
      if (res.ok) {
        // server should set auth cookie; redirect to admin home
        router.replace("/admin/home");
      } else {
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <div style={{ width: 360, padding: 28, background: "#fff", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src="/logo-small.png" alt="RailEats" style={{ width: 44, height: 44 }} />
          <div style={{ fontWeight: 700 }}>RailEats Admin</div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>User ID (mobile)</label>
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} required style={{ width:"100%", padding:10, marginBottom:12, borderRadius:6, border:"1px solid #ddd" }} />
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:"100%", padding:10, marginBottom:16, borderRadius:6, border:"1px solid #ddd" }} />
          <button type="submit" disabled={loading} style={{ width:"100%", padding:10, borderRadius:6, background:"#f5c400", border:"none", fontWeight:600 }}>
            {loading ? "Logging..." : "Log in"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:12 }}>
          <a href="/" style={{ fontSize:12, color:"#666" }}>Back to public site</a>
        </div>
      </div>
    </div>
  );
}
