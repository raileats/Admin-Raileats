="use client";
import { useState, useEffect } from "react";

type ContactRow = {
  id: string;
  name?: string;
  value?: string;
  active?: boolean;
};

type ContactsClientProps = {
  restroCode: string | number;
  initialEmails?: ContactRow[];
  initialWhatsapps?: ContactRow[];
};

export default function ContactsClient({
  restroCode,
  initialEmails = [],
  initialWhatsapps = [],
}: ContactsClientProps) {
  // Diagnostic log to inspect incoming props
  useEffect(() => {
    console.log("ContactsClient initial:", { restroCode, initialEmails, initialWhatsapps });
  }, [restroCode, initialEmails, initialWhatsapps]);

  // If server did not return any rows, show an example/sample row so UI looks like screenshot.
  // But keep actual state separate so Save will write actual user entries.
  const [emails, setEmails] = useState<ContactRow[]>(
    initialEmails.length ? initialEmails : []
  );
  const [whatsapps, setWhatsapps] = useState<ContactRow[]>(
    initialWhatsapps.length ? initialWhatsapps : []
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // If there is absolutely no data and it's first render, create sample rows for visual parity.
  useEffect(() => {
    if (!initialEmails.length && !initialWhatsapps.length) {
      // only add sample rows for display, not saved automatically
      setEmails([
        { id: "sample-email-1", name: "Akhil", value: "abc@gmail.com", active: true },
        { id: "sample-email-2", name: "Ram", value: "abc@gmail.com", active: true },
      ]);
      setWhatsapps([
        { id: "sample-wa-1", name: "Vinod Kumar", value: "9876543210", active: true },
        { id: "sample-wa-2", name: "Rajesh", value: "9876543210", active: true },
        { id: "sample-wa-3", name: "Suresh", value: "9876543210", active: true },
      ]);
    }
    // NOTE: if there is real data, we keep it as-is.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEmail = () =>
    setEmails((s) => [...s, { id: crypto.randomUUID(), name: "", value: "", active: true }]);

  const addWhatsapp = () =>
    setWhatsapps((s) => [...s, { id: crypto.randomUUID(), name: "", value: "", active: true }]);

  const updateRow = (
    list: ContactRow[],
    setList: (v: ContactRow[]) => void,
    id: string,
    field: keyof ContactRow,
    val: any
  ) => {
    setList(list.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const removeRow = (list: ContactRow[], setList: (v: ContactRow[]) => void, id: string) => {
    setList(list.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // filter out sample rows that we added for display (IDs starting with "sample-")
      const realEmails = emails.filter((e) => !e.id?.toString().startsWith("sample-"));
      const realWhats = whatsapps.filter((w) => !w.id?.toString().startsWith("sample-"));

      const payload = {
        emails: realEmails.map((r) => ({ name: r.name ?? "", value: r.value ?? "", active: !!r.active })),
        whatsapps: realWhats.map((r) => ({ name: r.name ?? "", value: r.value ?? "", active: !!r.active })),
      };

      // If there's nothing real to save, don't call the API — show message instead
      if (payload.emails.length === 0 && payload.whatsapps.length === 0) {
        setMsg("No real contact entries to save (sample rows ignored). Add contacts then Save.");
        setSaving(false);
        setTimeout(() => setMsg(null), 3500);
        return;
      }

      const res = await fetch(`/api/restros/${restroCode}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        console.error("Save contacts error:", json);
        setMsg(json?.error ?? "Failed to save contacts");
      } else {
        setMsg("Contacts saved successfully");
        // update local state ids if server returns inserted rows (optional)
      }
    } catch (err) {
      console.error("Save contacts unexpected:", err);
      setMsg("Unexpected error saving contacts");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3500);
    }
  };

  const SimpleRow = ({
    row,
    idx,
    type,
    list,
    setList,
  }: {
    row: ContactRow;
    idx: number;
    type: "email" | "whatsapp";
    list: ContactRow[];
    setList: (v: ContactRow[]) => void;
  }) => (
    <div className="grid grid-cols-12 gap-3 items-center mb-3 border-b pb-3">
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {type === "email" ? `Email Address Name ${idx + 1}` : `Whatsapp Mobile Name ${idx + 1}`}
        </label>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          value={row.name ?? ""}
          onChange={(e) => updateRow(list, setList, row.id!, "name", e.target.value)}
        />
      </div>

      <div className="col-span-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {type === "email" ? `Email Address ${idx + 1}` : `Whatsapp Mobile Number ${idx + 1}`}
        </label>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          value={row.value ?? ""}
          placeholder={type === "email" ? "abc@example.com" : "9876543210"}
          onChange={(e) => updateRow(list, setList, row.id!, "value", e.target.value)}
        />
      </div>

      <div className="col-span-3 text-sm text-gray-700">
        {type === "email"
          ? `Emails for Orders Receiving ${idx + 1}`
          : `Whatsapp Mobile Number for Orders Receiving ${idx + 1}`}
      </div>

      <div className="col-span-2 flex items-center">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!row.active}
            onChange={(e) => updateRow(list, setList, row.id!, "active", e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span className="ml-2 text-sm">{row.active ? "Status On" : "Status Off"}</span>
        </label>
      </div>

      <div className="col-span-1 text-right">
        <button
          type="button"
          onClick={() => removeRow(list, setList, row.id!)}
          className="text-red-600 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 px-2">
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Emails</h3>
          <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm" onClick={addEmail}>
            Add New Email
          </button>
        </div>

        {emails.length === 0 && <p className="text-sm text-gray-500 italic">No emails added yet.</p>}
        {emails.map((r, i) => (
          <SimpleRow key={r.id} row={r} idx={i} type="email" list={emails} setList={setEmails} />
        ))}
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">WhatsApp Numbers</h3>
          <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm" onClick={addWhatsapp}>
            Add New WhatsApp
          </button>
        </div>

        {whatsapps.length === 0 && <p className="text-sm text-gray-500 italic">No WhatsApp numbers added yet.</p>}
        {whatsapps.map((r, i) => (
          <SimpleRow key={r.id} row={r} idx={i} type="whatsapp" list={whatsapps} setList={setWhatsapps} />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div>{msg && <div className="text-sm text-green-600">{msg}</div>}</div>
        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded text-white ${saving ? "bg-gray-400" : "bg-green-600"}`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
