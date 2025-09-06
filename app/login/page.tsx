// app/login/page.tsx
"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp">("login");

  const handleSendOtp = () => {
    if (!mobile) return alert("Enter mobile number");
    // TODO: backend API call to send OTP
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    if (!otp) return alert("Enter OTP");
    // TODO: backend API call to verify OTP
    alert("✅ Login success (dummy)");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", textAlign: "center" }}>
      <h2>RailEats Admin Login</h2>

      {step === "login" && (
        <>
          <input
            type="text"
            placeholder="Enter Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            style={{ width: "100%", padding: "10px", margin: "10px 0" }}
          />
          <button onClick={handleSendOtp} style={{ padding: "10px 20px" }}>
            Send OTP
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: "100%", padding: "10px", margin: "10px 0" }}
          />
          <button onClick={handleVerifyOtp} style={{ padding: "10px 20px" }}>
            Verify OTP
          </button>
        </>
      )}
    </div>
  );
}
