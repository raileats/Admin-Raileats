'use client';
import React, { useEffect, useState } from 'react';
import RestroModal from '../admin/RestroModal';

export default function RestroMasterList() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  /* =========================
     FETCH + SAFE SORT
     ========================= */
  async function fetchList(search = '') {
    setLoading(true);
    try {
      const url = new URL('/api/restromaster', location.origin);
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error('restromaster fetch failed', res.status);
        setList([]);
        return;
      }

      const json = await res.json();
      const rows = Array.isArray(json) ? json : [];

      // 🔥 GUARANTEED DESC SORT BY RestroCode
      const sorted = [...rows]
        .filter(r => r.RestroCode !== null && r.RestroCode !== undefined)
        .sort((a, b) => {
          const aCode = parseInt(String(a.RestroCode).trim(), 10);
          const bCode = parseInt(String(b.RestroCode).trim(), 10);

          if (isNaN(aCode) && isNaN(bCode)) return 0;
          if (isNaN(aCode)) return 1;
          if (isNaN(bCode)) return -1;

          return bCode - aCode; // DESC
        });

      setList(sorted);
    } catch (e) {
      console.error('fetchList error', e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  /* =========================
     MODAL HANDLERS
     ========================= */
  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(r: any) {
    setEditing(r);
    setModalOpen(true);
  }

  /* =========================
     SAVE (CREATE / UPDATE)
     ========================= */
  async function handleSave(payload: any) {
    setSaving(true);
    try {
      if (payload.RestroCode && editing) {
        // UPDATE
        const res = await fetch('/api/restromaster', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok) {
          setList(prev =>
            prev.map(p => (p.RestroCode === json.RestroCode ? json : p))
          );
        } else {
          alert('Update failed: ' + (json.error || ''));
        }
      } else {
        // CREATE
        const res = await fetch('/api/restromaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok || res.status === 201) {
          // new restro ALWAYS on top
          setList(prev => [json, ...prev]);
        } else {
          alert('Create failed: ' + (json.error || ''));
        }
      }

      setModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Save error');
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     UI
     ========================= */
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search code / name / owner / station"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
        />
        <button onClick={() => fetchList(q)} style={{ padding: '8px 12px' }}>
          Search
        </button>
        <button
          onClick={openAdd}
          style={{
            padding: '8px 12px',
            background: '#16a34
