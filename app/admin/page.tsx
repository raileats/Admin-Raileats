// app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db as supabase } from '../../lib/db';               // relative import to lib
import TrainTypeahead from '../../components/TrainTypeahead'; // components in repo root
import OutletsList from '../../components/OutletsList';       // components in repo root

export default function AdminPage() {
  const [user, setUser] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // selected train state which we will pass to OutletsList
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) {
          console.warn('Supabase client not initialized (env may be missing)');
          setLoadingUser(false);
          return;
        }

        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.warn('supabase.auth.getUser error:', error);
        } else if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.warn('Unexpected getUser error:', err);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Admin — RailEats</h1>
          <p className="text-sm text-gray-600 mt-1">Admin dashboard for outlets & vendors.</p>
        </header>

        <section className="mb-6">
          {loadingUser ? (
            <div className="text-sm text-gray-600">Checking authentication...</div>
          ) : user ? (
            <div className="mb-4">
              <div className="text-sm text-gray-700">Signed in as: {user.email}</div>
            </div>
          ) : (
            <div className="p-3 border rounded bg-yellow-50 text-sm text-yellow-800">
              No authenticated user found. Some admin APIs may not work until you sign in or configure server envs.
            </div>
          )}
        </section>

        <section className="mb-6">
          <TrainTypeahead
            onSelect={(val: any) => {
              const v = typeof val === 'string' ? val : (val?.train_no ?? val?.number ?? null);
              setSelectedTrain(v);
            }}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Outlets for: {selectedTrain ?? '—'}</h2>

          {/* Pass required prop trainNo (string | null) to OutletsList */}
          <OutletsList trainNo={selectedTrain} />
        </section>
      </div>
    </main>
  );
}
