import React from 'react';
import { Brain, Database, ShieldCheck, Sparkles } from 'lucide-react';

const statuses = [
  ['Farmer memory', 'Personalized', 'User-provided'],
  ['Crop lifecycle', 'Calculated from planting date when available', 'Derived'],
  ['Weather', 'Live/cached depending on provider availability', 'External data'],
  ['Market', 'Verified records only', 'External data'],
  ['Finance', 'Recorded farm expenses', 'User data'],
];

export default function FarmIntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600">Puthumai Uzhavan 3.0</p>
        <h1 className="text-3xl font-bold">AI Farm Intelligence</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          One intelligence layer connecting your farmer profile, crop lifecycle, weather, market and finance data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><Brain className="mb-3 text-emerald-600" /><h2 className="font-semibold">Farm-aware AI</h2><p className="mt-1 text-sm text-slate-600">Recommendations should use only context actually available to the application.</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><Database className="mb-3 text-blue-600" /><h2 className="font-semibold">Data provenance</h2><p className="mt-1 text-sm text-slate-600">Live, cached, estimate and demo information are explicitly distinguishable.</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><ShieldCheck className="mb-3 text-amber-600" /><h2 className="font-semibold">AI safety</h2><p className="mt-1 text-sm text-slate-600">High-impact advice should be verified before the farmer acts on it.</p></div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><Sparkles className="text-emerald-600" /><h2 className="font-semibold">Data used by the farm brain</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {statuses.map(([name, value, source]) => (
            <div key={name} className="rounded-xl border p-4">
              <p className="font-medium">{name}</p><p className="text-sm text-slate-600">{value}</p><p className="mt-1 text-xs text-slate-400">{source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
