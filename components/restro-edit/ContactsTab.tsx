"use client";

import React, { useEffect, useState } from "react";
import ContactsClient from "@/components/tabs/ContactsClient";

export default function ContactsTab({ restroCode }: { restroCode: string }) {
  const [emails, setEmails] = useState<any[]>([]);
  const [whatsapps, setWhatsapps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase data fetch
  useEffect(() => {
    if (!restroCode) return;
    setLoading(true);
    setError(null);

    async function fetchContacts() {
      try {
        const res = await fetch(`/api/restros/${restroCode}/contacts`);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const data = await res.json();
        setEmails(data.emails || []);
        setWhatsapps(data.whatsapps || []);
      } catch (err: any) {
        console.error("Failed to load contacts:", err);
        setError(err.message || "Unable to load contacts");
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [restroCode]);

  if (loading) return <div className="p-4">Loading contacts...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Failed to load contacts — {error}
      </div>
    );

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Contacts</h3>
      <p className="text-gray-600 mb-4">
        Manage contact persons, email addresses, and WhatsApp numbers for this
        restaurant.
      </p>

      <ContactsClient
        restroCode={restroCode}
        initialEmails={emails}
        initialWhatsapps={whatsapps}
      />
    </div>
  );
}
