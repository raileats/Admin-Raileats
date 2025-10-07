"use client";
import React, { useCallback } from "react";
import TabContainer from "@/components/TabContainer";
import { Mail, Phone, User } from "lucide-react";

export default function ContactsTab({ local, updateField }: any) {
  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    return String(raw).replace(/\D/g, "").slice(0, 10);
  }, []);

  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      updateField(field, checked ? "ON" : "OFF");
    },
    [updateField]
  );

  const Input = ({ icon, value, onChange, placeholder, maxLength = 50 }: any) => (
    <div className="contact-input">
      {icon && <span className="icon">{icon}</span>}
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );

  const Toggle = ({ field, value }: any) => (
    <button
      type="button"
      onClick={() => handleToggle(field, value !== "ON")}
      className={`toggle-btn ${value === "ON" ? "on" : ""}`}
    >
      {value === "ON" ? "ON" : "OFF"}
    </button>
  );

  return (
    <TabContainer title="Contacts — Emails (max 2) & WhatsApp (max 3)">
      <div className="contact-grid">
        <div>
          <label>Name 1</label>
          <Input icon={<User size={16} />} value={local.EmailAddressName1} onChange={(v: any) => updateField("EmailAddressName1", v)} />
        </div>
        <div>
          <label>Email 1</label>
          <Input icon={<Mail size={16} />} value={local.EmailsforOrdersReceiving1} onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)} />
        </div>
        <div className="toggle-wrapper">
          <Toggle field="EmailsforOrdersStatus1" value={local.EmailsforOrdersStatus1} />
        </div>

        <div>
          <label>Name 2</label>
          <Input icon={<User size={16} />} value={local.EmailAddressName2} onChange={(v: any) => updateField("EmailAddressName2", v)} />
        </div>
        <div>
          <label>Email 2</label>
          <Input icon={<Mail size={16} />} value={local.EmailsforOrdersReceiving2} onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)} />
        </div>
        <div className="toggle-wrapper">
          <Toggle field="EmailsforOrdersStatus2" value={local.EmailsforOrdersStatus2} />
        </div>

        <div>
          <label>Mobile 1</label>
          <Input
            icon={<Phone size={16} />}
            value={local.WhatsappMobileNumberforOrderDetails1}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))}
            placeholder="10-digit number"
            maxLength={10}
          />
        </div>
        <div className="toggle-wrapper">
          <Toggle field="WhatsappMobileNumberStatus1" value={local.WhatsappMobileNumberStatus1} />
        </div>

        <div>
          <label>Mobile 2</label>
          <Input
            icon={<Phone size={16} />}
            value={local.WhatsappMobileNumberforOrderDetails2}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))}
            placeholder="10-digit number"
            maxLength={10}
          />
        </div>
        <div className="toggle-wrapper">
          <Toggle field="WhatsappMobileNumberStatus2" value={local.WhatsappMobileNumberStatus2} />
        </div>

        <div>
          <label>Mobile 3</label>
          <Input
            icon={<Phone size={16} />}
            value={local.WhatsappMobileNumberforOrderDetails3}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))}
            placeholder="10-digit number"
            maxLength={10}
          />
        </div>
        <div className="toggle-wrapper">
          <Toggle field="WhatsappMobileNumberStatus3" value={local.WhatsappMobileNumberStatus3} />
        </div>
      </div>

      <style jsx>{`
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          align-items: center;
        }
        label {
          font-weight: 600;
          font-size: 13px;
          color: #444;
          margin-bottom: 4px;
          display: block;
        }
        .contact-input {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 6px 8px;
        }
        .contact-input input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
        }
        .icon {
          margin-right: 6px;
          color: #888;
        }
        .toggle-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toggle-btn {
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 6px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 13px;
          transition: 0.2s;
        }
        .toggle-btn.on {
          background: #0ea5e9;
          color: white;
          border-color: #0ea5e9;
        }
      `}</style>
    </TabContainer>
  );
}
