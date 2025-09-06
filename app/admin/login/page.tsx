"use client";
import { useState } from "react";
export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  return (
    <main style={{ display:"grid", placeItems:"center", minHeight:"80vh" }}>
      <form style={{ width:320, padding:20, background:"#fff" }}>
        <h3>Login</h3>
        <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="phone" />
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" />
        <button type="button">Login</button>
      </form>
    </main>
  );
}
