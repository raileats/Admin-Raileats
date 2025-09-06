"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password: pass }),
    });
    if (res.ok) {
      router.push("/admin/home");
    } else {
      alert("Login failed");
    }
  }

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
      <form onSubmit={handleSubmit} style={{ width: 360, padding: 24, border: "1px solid #ddd", borderRadius: 6 }}>
        <h2>Log Into Your Account</h2>
        <label>Phone Number</label>
        <input value={phone} onChange={(e)=>setPhone(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} required />
        <button type="submit" style={{ marginTop: 12 }}>Log in »</button>
      </form>
    </main>
  );
}
