// app/page.tsx
'use client';

import React, { useState } from 'react';
import './globals.css';
import TrainTypeahead from '../components/TrainTypeahead'; // <-- root/components
import OutletsList from '../components/OutletsList';       // <-- root/components

export default function Page() {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">RailEats — Search by Train</h1>

        <div className="mb-6">
          <TrainTypeahead onSelect={(v) => {
            const val = typeof v === 'string' ? v : (v?.train_no ?? v?.number ?? null);
            setSelectedTrain(val);
          }} />
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-3">Outlets for: {selectedTrain ?? '—'}</h2>
          <OutletsList trainNo={selectedTrain} />
        </section>
      </div>
    </main>
  );
}
