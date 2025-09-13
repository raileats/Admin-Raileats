'use client';

import React, { useState } from 'react';
import './globals.css';                       // app/globals.css के लिए यही सही path है
import { supabase } from '../lib/supabaseClient'; // lib at project root -> from app/ use ../lib

import TrainTypeahead from '../components/TrainTypeahead';
import OutletsList from '../components/OutletsList';

export default function Page() {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RailEats — Search by Train</h1>
      <TrainTypeahead onSelect={(t) => setSelectedTrain(t)} />
      <div className="mt-6">
        <OutletsList trainNo={selectedTrain} />
      </div>
    </main>
  );
}
