"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ✅ Hard-coded credentials
    if (phone === "8799726485" && password === "admin123") {
      alert("Login successful!");
      router.push("/admin/home"); // Redirect to Admin Home
    } else {
      alert("Invalid user id or password");
    }
  }

  return (
    <main style={{ display:"grid", placeItems:"center", minHeight:"80vh", background:"#f9fafb" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 24,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ marginBottom: 16, textAlign:"center" }}>Admin Login</h2>

        <label style={{ display:"block", marginBottom:4 }}>User ID (Mobile)</label>
        <input
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          placeholder="Enter mobile number"
          required
          style={{ display:"block", marginBottom:12, width:"100%", padding:8 }}
        />

        <label style={{ display:"block", marginBottom:4 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="Enter password"
          required
          style={{ display:"block", marginBottom:16, width:"100%", padding:8 }}
        />

        <button
          type="submit"
          style={{
            width:"100%",
            padding:10,
            background:"#273e9a",
            color:"#fff",
            border:"none",
            borderRadius:4,
            fontWeight:"bold"
          }}
        >
          Login
        </button>
      </form>
    </main>
  );
}
