import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, XCircle, Sprout, Loader2 } from 'lucide-react';
import {
  getRecommendationOutcomes,
  recordRecommendationOutcome,
  summarizeOutcomes,
} from '../../services/farmOutcomeLearningService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';

interface Recommendation { id: string; text: string; }

export default function FarmOutcomePage() {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loadingRec, setLoadingRec] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!user?.id) { setLoadingRec(false); return; }
    supabase
      .from('recommendations')
      .select('id,notes,crop')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRecommendation({
            id: String(data.id),
            text: data.notes
              ? String(data.notes)
              : `Crop recommendation: ${String(data.crop ?? 'review your farm plan')}`,
          });
        } else {
          setRecommendation({
            id: 'default',
            text: 'Review irrigation after checking today\'s weather and crop stage.',
          });
        }
      })
      .catch(() => setRecommendation({
        id: 'default',
        text: 'Review irrigation after checking today\'s weather and crop stage.',
      }))
      .finally(() => setLoadingRec(false));
  }, [user?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = useMemo(() => summarizeOutcomes(), [refresh]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const outcomes = useMemo(() => getRecommendationOutcomes().slice(-8).reverse(), [refresh]);

  const save = (outcome: 'followed' | 'not_followed' | 'later') => {
    if (!recommendation) return;
    recordRecommendationOutcome(
      recommendation.id,
      recommendation.text,
      { source: 'farm-outcomes' },
      outcome,
    );
    setRefresh((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Sprout} title="Farm Outcomes" subtitle="Record what happened after a recommendation to build your farm history." />

      <GlassCard padding="lg">
        {loadingRec ? (
          <div className="flex items-center gap-3 text-sm text-ink-600">
            <Loader2 size={16} className="animate-spin text-brand-600" /> Loading latest recommendation…
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Sprout className="mt-1 text-brand-600 shrink-0" />
              <div>
                <h2 className="font-display font-bold text-ink-900">Latest recommendation</h2>
                <p className="mt-1 text-ink-700">{recommendation?.text}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button onClick={() => save('followed')}
                className="rounded-xl border border-gray-100 p-4 text-left hover:bg-brand-50 transition-colors">
                <CheckCircle2 className="mb-2 text-brand-600" />
                <span className="font-semibold text-ink-900">I followed it</span>
              </button>
              <button onClick={() => save('later')}
                className="rounded-xl border border-gray-100 p-4 text-left hover:bg-amber-50 transition-colors">
                <Clock3 className="mb-2 text-amber-600" />
                <span className="font-semibold text-ink-900">Later</span>
              </button>
              <button onClick={() => save('not_followed')}
                className="rounded-xl border border-gray-100 p-4 text-left hover:bg-red-50 transition-colors">
                <XCircle className="mb-2 text-error-600" />
                <span className="font-semibold text-ink-900">I didn't follow it</span>
              </button>
            </div>
          </>
        )}
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard padding="md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Recorded</p>
          <p className="text-3xl font-display font-extrabold text-ink-900 mt-1">{summary.total}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Followed</p>
          <p className="text-3xl font-display font-extrabold text-brand-700 mt-1">{summary.followed}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Later / Not followed</p>
          <p className="text-3xl font-display font-extrabold text-amber-700 mt-1">{summary.later + summary.notFollowed}</p>
        </GlassCard>
      </div>

      {outcomes.length > 0 && (
        <GlassCard padding="lg">
          <h2 className="font-display font-bold text-ink-900 mb-3">Recent outcomes</h2>
          <div className="space-y-2">
            {outcomes.map((item) => (
              <div key={item.id} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <span className="text-ink-800 flex-1 mr-4 truncate">{item.recommendation}</span>
                <span className="font-semibold capitalize text-ink-700 shrink-0">
                  {item.outcome.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
