// app/page.tsx
'use client';

import React, { useState } from 'react';
import './globals.css';
import TrainTypeahead from '../components/TrainTypeahead';
import OutletsList from '../components/OutletsList';
import supabase from '../../../lib/supabaseClient';

export default function Page() {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">RailEats — Search by Train</h1>
          <p className="text-sm text-gray-600 mt-1">
            Type train number or name and pick from suggestions.
          </p>
        </header>

        <section className="mb-6">
          <TrainTypeahead
            onSelect={(val: any) => {
              const v =
                typeof val === 'string'
                  ? val
                  : val?.train_no ?? val?.number ?? null;
              setSelectedTrain(v);
            }}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">
            Outlets for: {selectedTrain ?? '—'}
          </h2>
          <OutletsList trainNo={selectedTrain} />
        </section>
      </div>
    </main>
  );
}
