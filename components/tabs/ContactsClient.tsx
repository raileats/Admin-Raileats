"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ContactRow {
  id: string;
  name: string;
  value: string;
  active: boolean;
}

interface ContactsClientProps {
  initialEmails?: ContactRow[];
  initialWhatsapps?: ContactRow[];
}

export default function ContactsClient({
  initialEmails = [],
  initialWhatsapps = [],
}: ContactsClientProps) {
  const [emails, setEmails] = useState<ContactRow[]>(initialEmails);
  const [whatsapps, setWhatsapps] = useState<ContactRow[]>(initialWhatsapps);

  const addEmail = () => {
    setEmails([
      ...emails,
      { id: crypto.randomUUID(), name: "", value: "", active: true },
    ]);
  };

  const addWhatsapp = () => {
    setWhatsapps([
      ...whatsapps,
      { id: crypto.randomUUID(), name: "", value: "", active: true },
    ]);
  };

  const updateRow = (
    list: ContactRow[],
    setList: (v: ContactRow[]) => void,
    id: string,
    field: keyof ContactRow,
    val: any
  ) => {
    const newList = list.map((r) =>
      r.id === id ? { ...r, [field]: val } : r
    );
    setList(newList);
  };

  const renderTable = (
    title: string,
    rows: ContactRow[],
    setList: (v: ContactRow[]) => void,
    type: "email" | "whatsapp"
  ) => (
    <div className="border rounded-xl p-4 bg-white mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Button onClick={type === "email" ? addEmail : addWhatsapp}>
          {type === "email" ? "Add New Email" : "Add New WhatsApp"}
        </Button>
      </div>
      {rows.length === 0 && (
        <p className="text-gray-500 italic">No {type}s added yet.</p>
      )}
      {rows.map((row, idx) => (
        <div
          key={row.id}
          className="grid grid-cols-12 gap-3 items-center mb-2 border-b pb-2"
        >
          <div className="col-span-2">
            <Label className="text-sm">
              {type === "email"
                ? `Email Address Name ${idx + 1}`
                : `Whatsapp Mobile Name ${idx + 1}`}
            </Label>
            <Input
              value={row.name}
              onChange={(e) =>
                updateRow(rows, setList, row.id, "name", e.target.value)
              }
            />
          </div>
          <div className="col-span-4">
            <Label className="text-sm">
              {type === "email"
                ? `Email Address ${idx + 1}`
                : `Whatsapp Mobile Number ${idx + 1}`}
            </Label>
            <Input
              value={row.value}
              onChange={(e) =>
                updateRow(rows, setList, row.id, "value", e.target.value)
              }
              placeholder={
                type === "email" ? "abc@example.com" : "9876543210"
              }
            />
          </div>
          <div className="col-span-3 text-gray-700 text-sm">
            {type === "email"
              ? `Emails for Orders Receiving ${idx + 1}`
              : `Whatsapp Mobile Number for Orders Receiving ${idx + 1}`}
          </div>
          <div className="col-span-3 flex items-center justify-center">
            <Switch
              checked={row.active}
              onCheckedChange={(checked) =>
                updateRow(rows, setList, row.id, "active", checked)
              }
            />
            <span className="ml-2 text-sm">
              {row.active ? "Status On" : "Status Off"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const handleSave = async () => {
    console.log("Saving contacts:", { emails, whatsapps });
    // 🔹 TODO: Add Supabase save logic here
    // await saveContactsToSupabase(restroCode, { emails, whatsapps })
  };

  return (
    <div className="space-y-4">
      {renderTable("Emails", emails, setEmails, "email")}
      {renderTable("WhatsApp Numbers", whatsapps, setWhatsapps, "whatsapp")}
      <div className="text-right">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
