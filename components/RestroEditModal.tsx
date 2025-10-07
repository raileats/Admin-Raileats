import React, { useEffect, useState } from "react";

// RestroEditTabs -> RestroEditModal
// This file replaces the previous tab-only component with a modal-based editor
// that can be dropped into your existing RestroEdit flow.
// Usage: <RestroEditModal restroCode={code} isOpen={isOpen} onClose={()=>{}} />

type Restro = any;

export default function RestroEditModal({ restroCode, isOpen, onClose }: { restroCode: string; isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [restro, setRestro] = useState<Restro | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!restroCode || !isOpen) return;
    setLoading(true);
    fetch(`/api/restros/${restroCode}`)
      .then((r) => r.json())
      .then((data) => setRestro(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [restroCode, isOpen]);

  function onFieldChange(path: string, value: any) {
    setRestro((prev: any) => {
      const next = { ...(prev || {}) };
      next[path] = value;
      return next;
    });
    setDirty(true);
  }

  async function saveMain() {
    if (!restroCode || !restro) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restro),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setRestro(updated);
      setDirty(false);
      alert("Saved successfully");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[95%] md:w-4/5 lg:w-3/4 xl:w-2/3 rounded shadow-lg p-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit Restro — {restroCode}</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border" onClick={()=>{ setRestro(null); setDirty(false); onClose();}}>Close</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={saveMain} disabled={!dirty || loading}>Save</button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${activeTab==='basic'?'bg-orange-200':'bg-gray-100'}`} onClick={()=>setActiveTab('basic')}>Basic Information</button>
          <button className={`px-3 py-1 rounded ${activeTab==='station'?'bg-orange-200':'bg-gray-100'}`} onClick={()=>setActiveTab('station')}>Station Settings</button>
          <button className={`px-3 py-1 rounded ${activeTab==='address'?'bg-orange-200':'bg-gray-100'}`} onClick={()=>setActiveTab('address')}>Address & Documents</button>
          <button className={`px-3 py-1 rounded ${activeTab==='contact'?'bg-orange-200':'bg-gray-100'}`} onClick={()=>setActiveTab('contact')}>Contacts</button>
        </div>

        <div>
          {loading && <div className="mb-3 text-sm text-gray-500">Loading...</div>}

          {activeTab === 'basic' && (
            <BasicInfoTab restro={restro} onChange={onFieldChange} />
          )}

          {activeTab === 'station' && (
            <StationSettingsTab restro={restro} onChange={onFieldChange} />
          )}

          {activeTab === 'address' && (
            <AddressDocsTab restro={restro} onChange={onFieldChange} restroCode={restroCode} />
          )}

          {activeTab === 'contact' && (
            <ContactsTab restro={restro} onChange={onFieldChange} />
          )}
        </div>

      </div>
    </div>
  );
}

function TextRow({ label, value, onChange, placeholder, readOnly=false }: any) {
  return (
    <div className="grid grid-cols-5 gap-3 items-center py-1">
      <div className="col-span-1 text-sm text-gray-700">{label}</div>
      <div className="col-span-4">
        <input value={value ?? ""} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} className={`w-full border rounded px-2 py-1 ${readOnly? 'bg-gray-100': ''}`} />
      </div>
    </div>
  );
}

function BasicInfoTab({ restro, onChange }: { restro: any; onChange: (k:string,v:any)=>void }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Basic Information</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Restro Code" value={restro?.restro_code ?? restro?.RestroCode} onChange={(v:any)=>onChange('restro_code',v)} />
          <TextRow label="Station Code with Name" value={restro?.station_code_with_name ?? restro?.StationCodeWithName} onChange={(v:any)=>onChange('station_code_with_name',v)} />
          <TextRow label="Restro Name" value={restro?.restro_name ?? restro?.RestroName} onChange={(v:any)=>onChange('restro_name',v)} />
          <TextRow label="Brand Name if Any" value={restro?.brand_name ?? restro?.BrandName} onChange={(v:any)=>onChange('brand_name',v)} />
          <TextRow label="RailEats Status" value={restro?.raileats_status ?? restro?.RailEatsStatus} onChange={(v:any)=>onChange('raileats_status',v)} />
          <TextRow label="Is Irctc Approved" value={restro?.is_irctc_approved ?? restro?.IsIrctcApproved} onChange={(v:any)=>onChange('is_irctc_approved',v)} />
        </div>

        <div>
          <TextRow label="Owner Name" value={restro?.owner_name ?? restro?.OwnerName} onChange={(v:any)=>onChange('owner_name',v)} />
          <TextRow label="Owner Email" value={restro?.owner_email ?? restro?.OwnerEmail} onChange={(v:any)=>onChange('owner_email',v)} />
          <TextRow label="Owner Phone" value={restro?.owner_phone ?? restro?.OwnerPhone} onChange={(v:any)=>onChange('owner_phone',v)} />
          <TextRow label="Restro Email" value={restro?.restro_email ?? restro?.RestroEmail} onChange={(v:any)=>onChange('restro_email',v)} />
          <TextRow label="Restro Phone" value={restro?.restro_phone ?? restro?.RestroPhone} onChange={(v:any)=>onChange('restro_phone',v)} />
        </div>
      </div>
    </div>
  );
}

function StationSettingsTab({ restro, onChange }: { restro: any; onChange: (k:string,v:any)=>void }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Station Settings</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TextRow label="Fix from Basic Information (NGP)" value={restro?.fix_from_basic_info ?? restro?.FixFromBasicInfo} onChange={(v:any)=>onChange('fix_from_basic_info',v)} />
          <TextRow label="Station Category" value={restro?.station_category ?? restro?.StationCategory} onChange={(v:any)=>onChange('station_category',v)} />
          <TextRow label="Open Time" value={restro?.open_time ?? restro?.OpenTime} onChange={(v:any)=>onChange('open_time',v)} />
          <TextRow label="Close Time" value={restro?.close_time ?? restro?.CloseTime} onChange={(v:any)=>onChange('close_time',v)} />
        </div>

        <div>
          <TextRow label="Weekly Off" value={restro?.weekly_off ?? restro?.WeeklyOff} onChange={(v:any)=>onChange('weekly_off',v)} />
          <TextRow label="Minimum Order Value" value={restro?.minimum_order_value ?? restro?.MinimumOrderValue} onChange={(v:any)=>onChange('minimum_order_value',v)} />
          <TextRow label="Cut Off Time" value={restro?.cut_off_time ?? restro?.CutOffTime} onChange={(v:any)=>onChange('cut_off_time',v)} />
          <TextRow label="RailEats Customer Delivery Charge" value={restro?.customer_delivery_charge ?? restro?.CustomerDeliveryCharge} onChange={(v:any)=>onChange('customer_delivery_charge',v)} />
        </div>
      </div>
    </div>
  );
}

function AddressDocsTab({ restro, onChange, restroCode }: { restro: any; onChange: (k:string,v:any)=>void; restroCode: string }) {
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState("");
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);

  useEffect(()=>{
    if (!restro) return;
    setFssaiNumber(restro?.fssai_number ?? restro?.FSSAINumber ?? "");
    setFssaiExpiry(restro?.fssai_expiry ?? restro?.FSSAIExpiry ?? "");
  },[restro]);

  function validateFssaiExpiry(dateStr: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()); // at least 1 month
    return d >= min;
  }

  async function addNewFssaiEntry() {
    if (!validateFssaiExpiry(fssaiExpiry)) {
      alert('FSSAI expiry must be at least 1 month from today');
      return;
    }
    const form = new FormData();
    form.append('type','fssai');
    form.append('fssai_number', fssaiNumber);
    form.append('fssai_expiry', fssaiExpiry);
    if (fssaiFile) form.append('fssai_file', fssaiFile);

    const res = await fetch(`/api/restros/${restroCode}/docs`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) { alert('Failed to add FSSAI'); return; }
    alert('FSSAI added');
    window.location.reload();
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Address</h3>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <TextRow label="Restro Address" value={restro?.restro_address ?? restro?.RestroAddress} onChange={(v:any)=>onChange('restro_address',v)} />
          <TextRow label="City / Village" value={restro?.city ?? restro?.City} onChange={(v:any)=>onChange('city',v)} />
          <TextRow label="Pin Code" value={restro?.pin_code ?? restro?.PinCode} onChange={(v:any)=>onChange('pin_code',v)} />
          <TextRow label="Restro Latitude" value={restro?.restro_latitude ?? restro?.RestroLatitude} onChange={(v:any)=>onChange('restro_latitude',v)} />
        </div>
        <div>
          <TextRow label="State (non-editable)" value={restro?.state ?? restro?.State} onChange={()=>{}} readOnly />
          <TextRow label="District (non-editable)" value={restro?.district ?? restro?.District} onChange={()=>{}} readOnly />
          <TextRow label="Restro Longitude" value={restro?.restro_longitude ?? restro?.RestroLongitude} onChange={(v:any)=>onChange('restro_longitude',v)} />
        </div>
      </div>

      <h3 className="font-semibold mb-2">Documents</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3">
          <div className="grid grid-cols-6 gap-2 items-center">
            <div className="col-span-1 text-sm">FSSAI Number</div>
            <div className="col-span-2"><input value={fssaiNumber} onChange={(e)=>setFssaiNumber(e.target.value)} className="w-full border rounded px-2 py-1"/></div>
            <div className="col-span-2"><input type="date" value={fssaiExpiry} onChange={(e)=>setFssaiExpiry(e.target.value)} className="w-full border rounded px-2 py-1"/></div>
            <div className="col-span-1"><input type="file" onChange={(e:any)=>setFssaiFile(e.target.files?.[0] ?? null)} /></div>
          </div>

          <div className="mt-3">
            <button className="px-3 py-1 rounded bg-green-500 text-white" onClick={addNewFssaiEntry}>Add New FSSAI Entry</button>
          </div>
        </div>

        {/* GST and PAN sections (similar pattern) */}
        <div className="col-span-3">
          <div className="grid grid-cols-6 gap-2 items-center mt-4">
            <div className="col-span-1 text-sm">GST Number</div>
            <div className="col-span-5"><input value={restro?.gst_number ?? restro?.GSTNumber ?? ''} onChange={(e)=>onChange('gst_number', e.target.value)} className="w-full border rounded px-2 py-1"/></div>
          </div>
          <div className="mt-2">
            <button className="px-3 py-1 rounded bg-blue-500 text-white" onClick={async ()=>{
              const res = await fetch(`/api/restros/${restroCode}/docs`, { method: 'POST', body: JSON.stringify({ type: 'gst', gst_number: restro?.gst_number ?? restro?.GSTNumber }), headers: { 'Content-Type': 'application/json' }});
              if (!res.ok) { alert('Failed to add GST'); return; }
              alert('GST added'); window.location.reload();
            }}>Add New GST Entry</button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-6 gap-2 items-center mt-4">
            <div className="col-span-1 text-sm">PAN Number</div>
            <div className="col-span-5"><input value={restro?.pan_number ?? restro?.PANNumber ?? ''} onChange={(e)=>onChange('pan_number', e.target.value)} className="w-full border rounded px-2 py-1"/></div>
          </div>
          <div className="mt-2">
            <button className="px-3 py-1 rounded bg-amber-600 text-white" onClick={async ()=>{
              const res = await fetch(`/api/restros/${restroCode}/docs`, { method: 'POST', body: JSON.stringify({ type: 'pan', pan_number: restro?.pan_number ?? restro?.PANNumber }), headers: { 'Content-Type': 'application/json' }});
              if (!res.ok) { alert('Failed to add PAN'); return; }
              alert('PAN added'); window.location.reload();
            }}>Add New PAN Entry</button>
          </div>
        </div>

      </div>

    </div>
  );
}

function ContactsTab({ restro, onChange }: { restro: any; onChange: (k:string,v:any)=>void }) {
  function EmailRow({ idx }: { idx: number }) {
    const nameKey = `email_name_${idx}`;
    const emailKey = `email_for_orders_${idx}`;
    const statusKey = `email_status_${idx}`;
    return (
      <div className="grid grid-cols-6 gap-2 items-center py-1">
        <div className="col-span-1 text-sm">Name</div>
        <div className="col-span-1"><input value={restro?.[nameKey] ?? restro?.[`EmailAddressName${idx}`] ?? ''} onChange={(e)=>onChange(nameKey, e.target.value)} className="w-full border rounded px-2 py-1"/></div>
        <div className="col-span-2"><input value={restro?.[emailKey] ?? restro?.[`EmailsforOrdersReceiving${idx}`] ?? ''} onChange={(e)=>onChange(emailKey, e.target.value)} className="w-full border rounded px-2 py-1"/></div>
        <div className="col-span-1"><label className="flex items-center"><input type="checkbox" checked={!!restro?.[statusKey] ?? !!restro?.[`EmailAddressStatus${idx}`]} onChange={(e)=>onChange(statusKey, e.target.checked)} className="mr-2"/>Status</label></div>
        <div className="col-span-1"></div>
      </div>
    );
  }

  function WpRow({ idx }: { idx: number }) {
    const nameKey = `wp_name_${idx}`;
    const numKey = `wp_num_${idx}`;
    const statusKey = `wp_status_${idx}`;
    return (
      <div className="grid grid-cols-6 gap-2 items-center py-1">
        <div className="col-span-1 text-sm">Name</div>
        <div className="col-span-1"><input value={restro?.[nameKey] ?? restro?.[`WhatsappMobileNumberName${idx}`] ?? ''} onChange={(e)=>onChange(nameKey, e.target.value)} className="w-full border rounded px-2 py-1"/></div>
        <div className="col-span-2"><input value={restro?.[numKey] ?? restro?.[`WhatsappMobileNumberforOrderDetails${idx}`] ?? ''} onChange={(e)=>onChange(numKey, e.target.value)} className="w-full border rounded px-2 py-1"/></div>
        <div className="col-span-1"><label className="flex items-center"><input type="checkbox" checked={!!restro?.[statusKey] ?? !!restro?.[`WhatsappMobileNumberStatus${idx}`]} onChange={(e)=>onChange(statusKey, e.target.checked)} className="mr-2"/>Status</label></div>
        <div className="col-span-1"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Contact</h3>
      <div>
        <h4 className="font-medium mt-2">Emails</h4>
        <EmailRow idx={1} />
        <EmailRow idx={2} />
      </div>
      <div>
        <h4 className="font-medium mt-2">WhatsApp Mobiles</h4>
        <WpRow idx={1} />
        <WpRow idx={2} />
      </div>
    </div>
  );
}
