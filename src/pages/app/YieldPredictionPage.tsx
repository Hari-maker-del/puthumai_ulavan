import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Gauge, Wheat, Loader2, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useFarms } from '@/hooks/useFarms';
import { useToast } from '@/components/ui/Toast';
import { predictYield } from '@/services/yieldService';
import type { YieldResponse } from '@/services/types';

const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 };

export default function YieldPredictionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: farms = [], loading: farmsLoading } = useFarms(user?.id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YieldResponse | null>(null);
  const [form, setForm] = useState({ field: '', crop: '', area: '' });

  useEffect(() => {
    const first = farms[0];
    if (!first || form.field) return;
    setForm({ field: first.name, crop: first.crop, area: String(first.area) });
  }, [farms, form.field]);

  const fields = useMemo(() => farms.map((farm) => farm.name), [farms]);
  const crops = useMemo(() => Array.from(new Set(farms.map((farm) => farm.crop).filter(Boolean))), [farms]);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'field') {
      const farm = farms.find((item) => item.name === value);
      if (farm) setForm({ field: farm.name, crop: farm.crop, area: String(farm.area) });
    }
  };

  const predict = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id || !form.field || !form.crop || !form.area) {
      toast('Select a real farm and enter its area before requesting a prediction.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      setResult(await predictYield({ field: form.field, crop: form.crop, area: form.area }));
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Yield prediction is temporarily unavailable.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const primary = result?.fields[0];

  return (
    <div className="space-y-6">
      <PageHeader icon={TrendingUp} title="Yield Prediction" subtitle="Forecast harvest volumes using your real farm records and configured prediction service." />

      <form onSubmit={predict}>
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-9 w-9 rounded-xl bg-brand-100 grid place-items-center">
              <Gauge size={17} className="text-brand-700" />
            </div>
            <div>
              <div className="font-display font-bold text-ink-900">Prediction Parameters</div>
              <div className="text-xs text-ink-600">Only your saved farm data is used.</div>
            </div>
          </div>

          {farmsLoading ? (
            <CardSkeleton count={1} />
          ) : farms.length === 0 ? (
            <div className="rounded-2xl border p-5 text-sm text-ink-700">
              Add a farm first. Yield prediction will become available once real farm data exists.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Field" name="field" variant="select" value={form.field} onChange={set('field')} options={fields} />
              <FormField label="Crop" name="crop" variant="select" value={form.crop} onChange={set('crop')} options={crops} />
              <FormField label="Land Area (acres)" name="area" type="number" value={form.area} onChange={set('area')} placeholder="0.0" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || farms.length === 0}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-6 py-3 text-sm font-bold shadow-card hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={17} className="animate-spin" /> Predicting…</> : <><Sparkles size={17} /> Predict Yield</>}
          </button>
        </GlassCard>
      </form>

      {loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CardSkeleton count={2} /></motion.div>}

      {primary && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard padding="md">
              <Wheat size={20} className="text-brand-600" />
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink-600">Predicted Yield</div>
              <div className="font-display font-extrabold text-2xl text-ink-900">{primary.predicted.toLocaleString('en-IN')} {primary.unit}</div>
            </GlassCard>
            <GlassCard padding="md">
              <TrendingUp size={20} className="text-brand-600" />
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink-600">Last Season</div>
              <div className="font-display font-extrabold text-2xl text-ink-900">{primary.lastSeason.toLocaleString('en-IN')} {primary.unit}</div>
            </GlassCard>
            <GlassCard padding="md">
              <Gauge size={20} className="text-brand-600" />
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink-600">Confidence</div>
              <div className="font-display font-extrabold text-2xl text-ink-900">{primary.confidence}%</div>
            </GlassCard>
            <GlassCard padding="md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-600">Field</div>
              <div className="mt-2 font-display font-extrabold text-xl text-ink-900">{primary.field}</div>
              <div className="text-sm text-ink-600">{primary.crop} · {primary.area} acres</div>
            </GlassCard>
          </div>

          {result.trend.length > 0 && (
            <GlassCard padding="lg">
              <div className="font-display font-bold text-ink-900">Yield Trend</div>
              <div className="text-xs text-ink-600 mt-0.5">Values returned by the configured prediction service.</div>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="actual" connectNulls={false} />
                    <Area type="monotone" dataKey="predicted" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}
    </div>
  );
}
