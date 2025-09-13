// app/page.tsx
'use client';

import React, { useState } from 'react';
import './globals.css';                         // same folder (app/)
import { supabase } from '../lib/supabaseClient'; // app/ -> ../lib

import TrainTypeahead from './components/TrainTypeahead';
import OutletsList from './components/OutletsList';

export default function Page() {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // optional: quick check that supabase client imports fine
  // (no network call here, just safe check)
  React.useEffect(() => {
    if (!supabase) setMessage('Supabase client not initialized');
    else setMessage(null);
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">RailEats — Search by Train</h1>
          <p className="text-sm text-gray-600 mt-1">Type train number or name and select from the suggestions.</p>
          {message && <div className="text-sm text-red-600 mt-2">{message}</div>}
        </header>

        <section className="mb-6">
          {/* TrainTypeahead should call onSelect with a train identifier (string or number) */}
          <TrainTypeahead onSelect={(trainNoOrObj: any) => {
            // TrainTypeahead may return string or object containing number; handle both
            const val = typeof trainNoOrObj === 'string' ? trainNoOrObj : (trainNoOrObj?.train_no ?? trainNoOrObj?.number ?? null);
            setSelectedTrain(val);
          }} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Available outlets for: {selectedTrain ?? '—'}</h2>
          <OutletsList trainNo={selectedTrain} />
        </section>
      </div>
    </main>
  );
}
