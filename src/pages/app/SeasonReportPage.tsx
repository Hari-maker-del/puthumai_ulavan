import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, IndianRupee, Download, Printer, Droplets, Sprout, Wheat, AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatTile from '@/components/ui/StatTile';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Expense = { date: string; amount: number; category: string; farm_id?: string | null };
type Sale = { sold_at: string; quantity: number; unit_price: number; buyer_name?: string };
type Prediction = { created_at: string; predicted_yield: number; unit: string; crop: string; field_name: string };

export default function SeasonReportPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setExpenses([]);
      setSales([]);
      setPredictions([]);
      setLoading(false);
      setError('Sign in to view your farm season report.');
      return;
    }

    setLoading(true);
    setError(null);
    void Promise.all([
      supabase.from('expenses').select('date,amount,category,farm_id').eq('user_id', user.id),
      supabase.from('farm_sales').select('sold_at,quantity,unit_price,buyer_name').eq('user_id', user.id),
      supabase.from('yield_predictions').select('created_at,predicted_yield,unit,crop,field_name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]).then(([expenseResult, salesResult, predictionResult]) => {
      if (!active) return;
      const failures = [expenseResult.error, salesResult.error, predictionResult.error].filter(Boolean);
      if (failures.length) {
        setError('Some farm records could not be loaded. No missing values have been replaced with sample data.');
      }
      if (!expenseResult.error) setExpenses((expenseResult.data ?? []).map((r) => ({ date: String(r.date), amount: Number(r.amount ?? 0), category: String(r.category ?? 'Other'), farm_id: r.farm_id ? String(r.farm_id) : null })));
      if (!salesResult.error) setSales((salesResult.data ?? []).map((r) => ({ sold_at: String(r.sold_at), quantity: Number(r.quantity ?? 0), unit_price: Number(r.unit_price ?? 0), buyer_name: r.buyer_name ? String(r.buyer_name) : undefined })));
      if (!predictionResult.error) setPredictions((predictionResult.data ?? []).map((r) => ({ created_at: String(r.created_at), predicted_yield: Number(r.predicted_yield ?? 0), unit: String(r.unit ?? 'kg'), crop: String(r.crop ?? 'Crop'), field_name: String(r.field_name ?? 'Field') })));
    }).catch(() => {
      if (active) setError('Unable to load the season report. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  const totalCost = expenses.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
  const totalRevenue = sales.reduce((sum, row) => sum + Math.max(0, row.quantity * row.unit_price), 0);
  const netProfit = totalRevenue - totalCost;
  const topCrop = useMemo(() => {
    const totals: Record<string, number> = {};
    predictions.forEach((row) => { totals[row.crop] = (totals[row.crop] ?? 0) + Math.max(0, row.predicted_yield); });
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [predictions]);

  const printReport = () => window.print();

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarRange} title="Season Report" subtitle="Summary generated from your recorded sales, expenses and yield predictions." action={{ label: 'Print / Save PDF', icon: Download, onClick: printReport }} />

      {error && (
        <GlassCard padding="md" className="border-amber-100 bg-amber-50/60">
          <div className="flex items-start gap-3 text-sm text-amber-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>
        </GlassCard>
      )}

      <GlassCard padding="lg" className="bg-brand-700 text-white border-0">
        <div className="grid sm:grid-cols-3 gap-5">
          <div><div className="text-brand-100 text-sm">Net Profit</div><div className="font-display font-extrabold text-4xl mt-1">{loading ? '—' : `₹${netProfit.toLocaleString('en-IN')}`}</div><div className="mt-1 text-sm text-brand-200">Recorded revenue minus recorded costs</div></div>
          <div><div className="text-brand-100 text-sm">Total Revenue</div><div className="font-display font-extrabold text-3xl mt-1">{loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN')}`}</div><div className="mt-1 text-sm text-brand-200">Recorded farm sales only</div></div>
          <div><div className="text-brand-100 text-sm">Total Cost</div><div className="font-display font-extrabold text-3xl mt-1">{loading ? '—' : `₹${totalCost.toLocaleString('en-IN')}`}</div><div className="mt-1 text-sm text-brand-200">Recorded expense records only</div></div>
        </div>
      </GlassCard>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatTile icon={Sprout} label="Predicted Crops" value={`${new Set(predictions.map((p) => p.crop)).size}`} sub="from saved yield predictions" accent="bg-brand-600" />
        <StatTile icon={Wheat} label="Yield Predictions" value={`${predictions.length}`} sub="saved model outputs" accent="bg-emerald-600" delay={0.06} />
        <StatTile icon={IndianRupee} label="Top Predicted Crop" value={topCrop} sub="by saved predicted volume" accent="bg-amber-600" delay={0.12} />
      </div>

      <GlassCard padding="lg">
        <div className="flex items-center justify-between"><div><div className="font-display font-bold text-ink-900">Recorded transactions</div><div className="text-xs text-ink-600 mt-0.5">Only records returned for the signed-in farmer are shown.</div></div><button onClick={printReport} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-ink-700"><Printer size={14} /> Print</button></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] font-bold uppercase tracking-wider text-ink-600 border-b border-gray-100"><th className="pb-3">Date</th><th className="pb-3">Type</th><th className="pb-3">Description</th><th className="pb-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-ink-900/5">
          {expenses.map((row, i) => <tr key={`e-${row.date}-${row.category}-${i}`}><td className="py-3">{row.date}</td><td className="py-3">Expense</td><td className="py-3">{row.category}</td><td className="py-3 text-right font-semibold">−₹{Math.max(0, row.amount).toLocaleString('en-IN')}</td></tr>)}
          {sales.map((row, i) => <tr key={`s-${row.sold_at}-${i}`}><td className="py-3">{row.sold_at.slice(0, 10)}</td><td className="py-3">Sale</td><td className="py-3">{row.buyer_name ?? 'Recorded sale'}</td><td className="py-3 text-right font-semibold text-brand-600">+₹{Math.max(0, row.quantity * row.unit_price).toLocaleString('en-IN')}</td></tr>)}
          {!expenses.length && !sales.length && <tr><td colSpan={4} className="py-10 text-center text-ink-500">No transaction records yet.</td></tr>}
        </tbody></table></div>
      </GlassCard>

      <GlassCard padding="lg">
        <div className="flex items-center gap-2"><Droplets size={18} className="text-brand-600" /><div><div className="font-display font-bold text-ink-900">Yield prediction history</div><div className="text-xs text-ink-600">Saved model outputs — estimates, not confirmed harvest results.</div></div></div>
        <div className="mt-4 space-y-2">{predictions.length ? predictions.slice(0, 10).map((row) => <div key={`${row.created_at}-${row.field_name}-${row.crop}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 p-3"><div><div className="font-semibold text-ink-900">{row.crop} · {row.field_name}</div><div className="text-xs text-ink-500">{new Date(row.created_at).toLocaleDateString('en-IN')}</div></div><div className="font-bold text-brand-700">{Math.max(0, row.predicted_yield).toLocaleString('en-IN')} {row.unit}</div></div>) : <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-ink-500">No saved yield predictions yet.</div>}</div>
      </GlassCard>
    </div>
  );
}
