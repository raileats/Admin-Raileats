// app/page.tsx
'use client';

import React, { useState } from 'react';
import './globals.css'; // app/ के अंदर same-folder import

// app/components में मौजूद components के लिए यह path सही है:
import TrainTypeahead from './components/TrainTypeahead';
import OutletsList from './components/OutletsList';
// अगर आप station-based search रखना चाहते हैं तो यह उपयोग कर सकते हैं:
// import StationSearch from './components/StationSearch';

export default function Page() {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">RailEats — Search by Train / Station</h1>
          <p className="text-sm text-gray-600 mt-1">Type train number/name or search by station and select.</p>
          {info && <div className="text-sm text-red-600 mt-2">{info}</div>}
        </header>

        <section className="mb-6">
          {/* Use TrainTypeahead (recommended if you have train table) */}
          <TrainTypeahead
            onSelect={(val: any) => {
              // TrainTypeahead may return string or object
              const v = typeof val === 'string' ? val : (val?.train_no ?? val?.number ?? null);
              setSelectedTrain(v);
            }}
          />

          {/* Or (alternative) use StationSearch which may return station/trains */}
          {/* <StationSearch onSelect={(val)=> { setSelectedTrain(typeof val==='string'?val:(val?.train_no ?? val?.StationCode ?? null)) }} /> */}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Outlets for: {selectedTrain ?? '—'}</h2>
          <OutletsList trainNo={selectedTrain} />
        </section>
      </div>
    </main>
  );
}
