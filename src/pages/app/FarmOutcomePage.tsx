import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, XCircle, Sprout } from 'lucide-react';
import { getRecommendationOutcomes, recordRecommendationOutcome, summarizeOutcomes } from '../../services/farmOutcomeLearningService';

const recommendation = {
  id: 'demo-recommendation',
  text: 'Review irrigation after checking today’s weather and crop stage.',
};

export default function FarmOutcomePage() {
  const [refresh, setRefresh] = useState(0);
  const summary = useMemo(() => summarizeOutcomes(), [refresh]);
  const outcomes = useMemo(() => getRecommendationOutcomes().slice(-8).reverse(), [refresh]);

  const save = (outcome: 'followed' | 'not_followed' | 'later') => {
    recordRecommendationOutcome(recommendation.id, recommendation.text, { source: 'farm-intelligence' }, outcome);
    setRefresh(v => v + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600">AI feedback loop</p>
        <h1 className="text-3xl font-bold">Farm Outcomes</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Record what happened after a recommendation. This creates farm history for future, evidence-aware decisions.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Sprout className="mt-1 text-emerald-600" />
          <div>
            <h2 className="font-semibold">Current recommendation</h2>
            <p className="mt-1 text-slate-700">{recommendation.text}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button onClick={() => save('followed')} className="rounded-xl border p-4 text-left hover:bg-emerald-50"><CheckCircle2 className="mb-2 text-emerald-600" /><span className="font-medium">I followed it</span></button>
          <button onClick={() => save('later')} className="rounded-xl border p-4 text-left hover:bg-amber-50"><Clock3 className="mb-2 text-amber-600" /><span className="font-medium">Later</span></button>
          <button onClick={() => save('not_followed')} className="rounded-xl border p-4 text-left hover:bg-rose-50"><XCircle className="mb-2 text-rose-600" /><span className="font-medium">I didn't follow it</span></button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Recorded</p><p className="text-2xl font-bold">{summary.total}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Followed</p><p className="text-2xl font-bold">{summary.followed}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Later / not followed</p><p className="text-2xl font-bold">{summary.later + summary.notFollowed}</p></div>
      </div>

      {outcomes.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Recent outcomes</h2>
          <div className="mt-3 space-y-2">
            {outcomes.map(item => (
              <div key={item.id} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <span>{item.recommendation}</span><span className="font-medium capitalize">{item.outcome.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
