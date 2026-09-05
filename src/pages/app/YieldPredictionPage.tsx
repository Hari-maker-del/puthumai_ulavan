import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Gauge, Wheat, Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import { useYieldPrediction } from '@/hooks/useYieldPrediction';
import { useAuth } from '@/context/AuthContext';

/**
 * Production-safe yield page.
 *
 * This page intentionally avoids Recharts so the yield route cannot fail just
 * because the chart bundle is unavailable or incompatible. It also does not
 * use legacy demo/dummy yield values: numbers shown here come from the real
 * yield API response only.
 */
export default function YieldPredictionPage() {
  const { data, loading, error, mutate } = useYieldPrediction();
  const { user } = useAuth();
  const [form, setForm] = useState({ field: '', crop: '', area: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    try {
      await mutate({ ...form, userId: user?.id });
    } catch {
      // useApiMutation stores the safe, normalized error for the UI.
    }
  };

  // Treat malformed/partial backend responses as empty data instead of
  // allowing a missing fields/trend property to crash the whole route.
  const fields = useMemo(() => (Array.isArray(data?.fields) ? data.fields : []), [data]);
  const trend = useMemo(() => (Array.isArray(data?.trend) ? data.trend : []), [data]);

  const maxPredicted = useMemo(
    () => Math.max(1, ...fields.map((item) => Number(item.predicted) || 0)),
    [fields],
  );

  const hasResults = fields.length > 0 || trend.length > 0;

  const retry = () => {
    if (form.field && form.crop && form.area) void mutate({ ...form, userId: user?.id });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Yield Prediction"
        subtitle="Estimate harvest using your farm records and growth data."
      />

      <form onSubmit={submit}>
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-9 w-9 rounded-xl bg-brand-100 grid place-items-center">
              <Gauge size={17} className="text-brand-700" />
            </div>
            <div>
              <div className="font-display font-bold text-ink-900">Prediction details</div>
              <div className="text-xs text-ink-600">Enter the field information used for the real prediction.</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Field" name="field" value={form.field} onChange={set('field')} placeholder="e.g. Field A" />
            <FormField label="Crop" name="crop" value={form.crop} onChange={set('crop')} placeholder="e.g. Paddy" />
            <FormField label="Land Area (acres)" name="area" type="number" value={form.area} onChange={set('area')} placeholder="0.0" />
          </div>

          <button
            type="submit"
            disabled={loading || !form.field || !form.crop || !form.area}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-6 py-3 text-sm font-bold shadow-card hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={17} className="animate-spin" /> Predicting…</> : <><Sparkles size={17} /> Predict Yield</>}
          </button>
        </GlassCard>
      </form>

      {submitted && error && (
        <GlassCard padding="lg" className="border border-amber-100 bg-amber-50/60">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white grid place-items-center">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-ink-900">Yield prediction is temporarily unavailable</div>
              <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                We could not retrieve your yield prediction right now. Your farm data is safe. Please try again in a few moments.
              </p>
              <button
                type="button"
                onClick={retry}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {submitted && !loading && !error && data && !hasResults && (
        <GlassCard padding="lg">
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-100 grid place-items-center">
              <Wheat size={22} className="text-brand-700" />
            </div>
            <div className="mt-4 font-display font-bold text-lg text-ink-900">No yield data available yet</div>
            <p className="mt-1 text-sm text-ink-600">Add or sync your farm records before requesting a prediction.</p>
          </div>
        </GlassCard>
      )}

      {data && !error && fields.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((item) => (
              <GlassCard key={`${item.field}-${item.crop}`} padding="md" hover className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display font-bold text-ink-900">{item.field}</div>
                    <div className="text-xs text-ink-600 mt-0.5">{item.crop} · {item.area}</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-brand-100 grid place-items-center">
                    <Wheat size={18} className="text-brand-700" />
                  </div>
                </div>
                <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-600">Predicted yield</div>
                <div className="font-display font-extrabold text-2xl text-ink-900">
                  {Number(item.predicted).toLocaleString('en-IN')} {item.unit}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ink-600">Model confidence</span>
                  <span className="font-bold text-brand-600">{Number(item.confidence)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-ink-900/5 overflow-hidden">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.max(0, Number(item.confidence) || 0))}%` }} />
                </div>
                <div className="mt-4 text-xs text-ink-600">
                  Relative field estimate: {((Number(item.predicted) || 0) / maxPredicted * 100).toFixed(0)}%
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}

      {data && !error && trend.length > 0 && (
        <GlassCard padding="lg">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-100 grid place-items-center">
              <TrendingUp size={17} className="text-brand-700" />
            </div>
            <div>
              <div className="font-display font-bold text-ink-900">Yield trend</div>
              <div className="text-xs text-ink-600">Returned by the yield service</div>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-ink-600 border-b border-gray-100">
                  <th className="pb-3 pr-4">Period</th>
                  <th className="pb-3 pr-4 text-right">Actual</th>
                  <th className="pb-3 text-right">Predicted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {trend.map((point, index) => (
                  <tr key={`${point.month}-${index}`}>
                    <td className="py-3 pr-4 font-semibold text-ink-900">{point.month}</td>
                    <td className="py-3 pr-4 text-right text-ink-600">{Number(point.actual ?? 0).toLocaleString('en-IN')} kg</td>
                    <td className="py-3 text-right font-bold text-brand-600">{Number(point.predicted ?? 0).toLocaleString('en-IN')} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {!submitted && (
        <GlassCard padding="lg" className="bg-brand-50/50 border border-brand-100">
          <div className="flex items-start gap-3">
            <Wheat size={20} className="mt-0.5 text-brand-700" />
            <div>
              <div className="font-semibold text-ink-900">Your prediction uses real farm data</div>
              <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                No sample yield numbers are shown before a successful response from the backend. If your farm has no yield records yet, the page will tell you instead of inventing a prediction.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
