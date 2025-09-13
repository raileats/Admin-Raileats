// app/page.tsx
'use client';

import React, { useState } from 'react';
import './globals.css';
import TrainTypeahead from './components/TrainTypeahead';
import OutletsList from './components/OutletsList';

export default function Page() {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">RailEats — Search by Train</h1>
        <TrainTypeahead onSelect={(v) => setSelectedTrain(typeof v === 'string' ? v : (v?.train_no ?? v?.number ?? null))} />
        <div className="mt-6">
          <OutletsList trainNo={selectedTrain} />
        </div>
      </div>
    </main>
  );
}
