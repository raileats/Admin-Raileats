import { useState } from 'react';
import TrainTypeahead from '../components/TrainTypeahead';
import OutletsList from '../components/OutletsList';

export default function Home() {
  const [train, setTrain] = useState(null);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RailEats — Search by Train</h1>
      <TrainTypeahead onSelect={(t) => setTrain(t)} />
      <div className="mt-6">
        <OutletsList trainNo={train} />
      </div>
    </main>
  );
}
