// components/admin/RestroModal.tsx
'use client';
import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: any; // initial values for edit, undefined for add
  onSave: (payload: any) => Promise<void>;
  saving?: boolean;
};

export default function RestroModal({ open, onClose, initial = {}, onSave, saving }: Props) {
  const [form, setForm] = React.useState<any>({ ...initial });

  React.useEffect(() => setForm({ ...initial }), [initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded w-[95%] max-w-3xl">
        <h3 className="text-lg font-semibold mb-4">{initial?.RestroCode ? 'Edit Restro' : 'Add New Restro'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2">
            <div className="text-sm">Restro Code</div>
            <input value={form.RestroCode || ''} onChange={(e)=>setForm({...form, RestroCode: e.target.value})}
              className="w-full border p-2 rounded" disabled={!!initial?.RestroCode} />
          </label>

          <label className="col-span-2">
            <div className="text-sm">Restro Name</div>
            <input value={form.RestroName || ''} onChange={(e)=>setForm({...form, RestroName: e.target.value})}
              className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">Owner Name</div>
            <input value={form.OwnerName || ''} onChange={(e)=>setForm({...form, OwnerName: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">Owner Phone</div>
            <input value={form.OwnerPhone || ''} onChange={(e)=>setForm({...form, OwnerPhone: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">Station Code</div>
            <input value={form.StationCode || ''} onChange={(e)=>setForm({...form, StationCode: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">Station Name</div>
            <input value={form.StationName || ''} onChange={(e)=>setForm({...form, StationName: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">FSSAI Number</div>
            <input value={form.FSSAINumber || ''} onChange={(e)=>setForm({...form, FSSAINumber: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">FSSAI Expiry</div>
            <input type="date" value={form.FSSAIExpiryDate || ''} onChange={(e)=>setForm({...form, FSSAIExpiryDate: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">IRCTC Status</div>
            <input value={form.IRCTCStatus || ''} onChange={(e)=>setForm({...form, IRCTCStatus: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label>
            <div className="text-sm">Raileats Status</div>
            <input value={form.RaileatsStatus || ''} onChange={(e)=>setForm({...form, RaileatsStatus: e.target.value})} className="w-full border p-2 rounded" />
          </label>

          <label className="col-span-2 flex items-center gap-3">
            <input type="checkbox" checked={!!form.IsIrctcApproved} onChange={(e)=>setForm({...form, IsIrctcApproved: e.target.checked})} />
            <div className="text-sm">Is IRCTC Approved</div>
          </label>

        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">
            {saving ? 'Saving...' : (initial?.RestroCode ? 'Save Changes' : 'Add Restro')}
          </button>
        </div>
      </div>
    </div>
  );
}
