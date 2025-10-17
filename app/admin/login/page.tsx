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

      if (res.ok) {
        // server should set cookie; now navigate to admin home
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f3f4f6",
      padding: 20
    }}>
      <form onSubmit={handleSubmit} style={{ width:360, padding:24, background:"#fff", borderRadius:8, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <img src="/logo.png" alt="RailEats" style={{ height:48, display:"inline-block" }} />
          <h2 style={{ margin: 6 }}>RailEats Admin</h2>
        </div>

        <label style={{ fontSize: 13, color: "#444" }}>User ID (mobile)</label>
        <input value={phone} onChange={(e)=>setPhone(e.target.value)} required style={{ width:"100%", padding:10, marginBottom:12, border:"1px solid #ddd", borderRadius:6 }} />

        <label style={{ fontSize: 13, color: "#444" }}>Password</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:"100%", padding:10, marginBottom:16, border:"1px solid #ddd", borderRadius:6 }} />

        <button type="submit" disabled={loading} style={{ width:"100%", padding:10, background:"#111827", color:"#fff", borderRadius:6 }}>
          {loading ? "Logging..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
