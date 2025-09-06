"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const router = useRouter();

  function handleLogin(e: any) {
    e.preventDefault();
    if (mobile && otp) {
      router.push("/admin");
    } else {
      alert("Enter mobile & OTP");
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <form onSubmit={handleLogin} style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 0 10px #ccc" }}>
        <h2>Admin Login</h2>
        <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }} />
        <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }} />
        <button type="submit" style={{ padding: 10, width: "100%", background: "#222", color: "#fff" }}>
          Login
        </button>
      </form>
    </div>
  );
}