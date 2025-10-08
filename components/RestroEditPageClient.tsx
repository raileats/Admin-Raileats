// components/RestroEditPageClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import RestroEditModal from "./RestroEditModal";
import { useRouter } from "next/navigation";

type SaveResult =
  | { ok: true; row?: any }
  | { ok: false; error: any };

type Props = {
  // Provide restroCode when rendering this client component.
  // If you obtain code from route params, pass it in from the parent.
  restroCode: string;
  // optionally you can prefetch restro and pass it
  restro?: any;
};

export default function RestroEditPageClient({ restroCode, restro: initialRestro }: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restro, setRestro] = useState<any | null>(initialRestro ?? null);

  // If parent didn't pass restro, fetch minimal data client-side for UI (optional)
  useEffect(() => {
    let mounted = true;
    if (!initialRestro && restroCode) {
      fetch(`/api/restros/${restroCode}`)
        .then((r) => r.json())
        .then((data) => {
          const payload = data?.data ?? data;
          if (mounted) setRestro(payload);
        })
        .catch((e) => console.error(e));
    }
    return () => {
      mounted = false;
    };
  }, [initialRestro, restroCode]);

  // handleSave returns SaveResult union — literal ok: true/false so TS narrows correctly
  async function handleSave(updatedFields: any): Promise<SaveResult> {
    setSaving(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "patch_failed");
        return { ok: false, error: txt };
      }

      const json = await res.json().catch(() => null);
      const row = json?.data ?? json;

      // Optionally update local UI
      setRestro(row ?? updatedFields);

      return { ok: true, row };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    // navigate back to list by default — adjust as needed
    router.push("/admin/restros");
  }

  // Render a wrapper that shows the modal. The modal accepts onSave and onClose.
  return (
    <div>
      {/* You can render header / breadcrumbs here */}
      <RestroEditModal
        restro={restro ?? undefined}
        restroCode={restroCode}
        isOpen={isOpen}
        initialTab="Basic Information"
        onClose={handleClose}
        onSave={handleSave}
        stationsOptions={[]} // pass real options if available
      />
      {/* Maybe show a small save indicator */}
      {saving && <div className="fixed bottom-4 right-4 bg-yellow-200 p-2 rounded shadow">Saving…</div>}
    </div>
  );
}
