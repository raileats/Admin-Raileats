// components/restro-edit/ContactsTab.tsx
"use client";
import React, { useCallback } from "react";

type CommonProps = {
  local:any;
  updateField:(k:string,v:any)=>void;
  InputWithIcon?: any;
};

export default function ContactsTab(props: CommonProps) {
  const { local = {}, updateField, InputWithIcon } = props;

  const Input = InputWithIcon ? InputWithIcon : ({ label, value, onChange, placeholder="", maxLength, type="text" }: any) => (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ marginBottom:6, fontSize:13, fontWeight:600 }}>{label}</div>}
      <input value={value ?? ""} placeholder={placeholder} onChange={(e)=>onChange(e.target.value)} maxLength={maxLength} inputMode={type==="phone" ? "numeric":"text"} style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:"1px solid #e6e6e6", fontSize:14 }} />
    </div>
  );

  // pill toggle so click area is obvious
  const Toggle = ({ checked, onChange }: any) => (
    <button
      type="button"
      aria-pressed={!!checked}
      onClick={()=>onChange(!checked)}
      style={{
        border: "none",
        background: checked ? "#06b6d4" : "#f1f5f9",
        color: checked ? "#fff" : "#374151",
        padding: "6px 10px",
        borderRadius: 20,
        cursor: "pointer",
        fontWeight: 700,
        minWidth: 48,
      }}
    >
      {checked ? "ON" : "OFF"}
    </button>
  );

  const sanitizePhone = useCallback((raw:any)=>{
    if (raw === undefined || raw === null) return "";
    return String(raw).replace(/\D/g, "").slice(0,10);
  }, []);

  const handleToggle = useCallback((field:string, checked:boolean)=>{
    const val = checked ? "ON":"OFF";
    updateField(field, val);
  }, [updateField]);

  // layout grid: three columns (label+input, input, toggle)
  return (
    <div>
      <h3 style={{ textAlign:"center", marginTop:0 }}>Contacts — Emails (max 2) & WhatsApp (max 3)</h3>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 120px", gap:16, alignItems:"center" }}>
        {/* Email1 */}
        <div>
          <Input label="Name 1" value={local.EmailAddressName1 ?? ""} onChange={(v:any)=>updateField("EmailAddressName1", v)} placeholder="Name 1" />
        </div>
        <div>
          <Input label="Email 1" value={local.EmailsforOrdersReceiving1 ?? ""} onChange={(v:any)=>updateField("EmailsforOrdersReceiving1", v)} type="email" placeholder="email1@example.com" />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-start" }}>
          <Toggle checked={String(local.EmailsforOrdersStatus1 ?? "OFF")==="ON"} onChange={(c:boolean)=>handleToggle("EmailsforOrdersStatus1", c)} />
        </div>

        {/* Email2 */}
        <div>
          <Input label="Name 2" value={local.EmailAddressName2 ?? ""} onChange={(v:any)=>updateField("EmailAddressName2", v)} placeholder="Name 2" />
        </div>
        <div>
          <Input label="Email 2" value={local.EmailsforOrdersReceiving2 ?? ""} onChange={(v:any)=>updateField("EmailsforOrdersReceiving2", v)} type="email" placeholder="email2@example.com" />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-start" }}>
          <Toggle checked={String(local.EmailsforOrdersStatus2 ?? "OFF")==="ON"} onChange={(c:boolean)=>handleToggle("EmailsforOrdersStatus2", c)} />
        </div>
      </div>

      <hr style={{ margin:"18px 0" }} />

      <h3 style={{ textAlign:"center", marginTop:0 }}>WhatsApp numbers (max 3)</h3>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 120px", gap:16, alignItems:"center" }}>
        <div>
          <Input label="Name 1" value={local.WhatsappMobileNumberName1 ?? ""} onChange={(v:any)=>updateField("WhatsappMobileNumberName1", v)} placeholder="Name 1" />
        </div>
        <div>
          <Input label="Mobile 1" value={local.WhatsappMobileNumberforOrderDetails1 ?? ""} onChange={(v:any)=>updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))} placeholder="10-digit mobile" type="phone" maxLength={10} />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-start" }}>
          <Toggle checked={String(local.WhatsappMobileNumberStatus1 ?? "OFF")==="ON"} onChange={(c:boolean)=>handleToggle("WhatsappMobileNumberStatus1", c)} />
        </div>

        <div>
          <Input label="Name 2" value={local.WhatsappMobileNumberName2 ?? ""} onChange={(v:any)=>updateField("WhatsappMobileNumberName2", v)} placeholder="Name 2" />
        </div>
        <div>
          <Input label="Mobile 2" value={local.WhatsappMobileNumberforOrderDetails2 ?? ""} onChange={(v:any)=>updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))} placeholder="10-digit mobile" type="phone" maxLength={10} />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-start" }}>
          <Toggle checked={String(local.WhatsappMobileNumberStatus2 ?? "OFF")==="ON"} onChange={(c:boolean)=>handleToggle("WhatsappMobileNumberStatus2", c)} />
        </div>

        <div>
          <Input label="Name 3" value={local.WhatsappMobileNumberName3 ?? ""} onChange={(v:any)=>updateField("WhatsappMobileNumberName3", v)} placeholder="Name 3" />
        </div>
        <div>
          <Input label="Mobile 3" value={local.WhatsappMobileNumberforOrderDetails3 ?? ""} onChange={(v:any)=>updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))} placeholder="10-digit mobile" type="phone" maxLength={10} />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-start" }}>
          <Toggle checked={String(local.WhatsappMobileNumberStatus3 ?? "OFF")==="ON"} onChange={(c:boolean)=>handleToggle("WhatsappMobileNumberStatus3", c)} />
        </div>
      </div>

      <div style={{ marginTop:18, color:"#666", fontSize:13 }}>
        Tip: Toggle पर क्लिक करें — pill-style button होना चाहिए और तुरंत ON/OFF दिखेगा. अगर DB में update नहीं जा रहा तो Save दबाने के बाद Console (Network/JS) देखें.
      </div>
    </div>
  );
}
