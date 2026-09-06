import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Printer, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { buildFarmReportText } from '@/services/farmReportService';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';

export default function FarmReportPage() {
  const { user, profile } = useAuth();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError('Sign in to generate your farm report.');
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [farmRes, expenseRes, yieldRes] = await Promise.all([
          supabase.from('farms').select('name,location').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('expenses').select('amount').eq('user_id', user.id),
          supabase.from('yield_predictions').select('predicted_yield,unit,crop').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);

        if (!active) return;
        const failures = [farmRes.error, expenseRes.error, yieldRes.error].filter(Boolean);
        if (failures.length) throw new Error('Some farm records could not be loaded.');

        const totalExpenses = (expenseRes.data ?? []).reduce((sum, r) => sum + Math.max(0, Number(r.amount ?? 0)), 0);
        const latestYield = yieldRes.data;

        setReport(buildFarmReportText({
          farmerName: profile?.full_name ?? user.email ?? 'Farmer',
          farmName: farmRes.data?.name ?? undefined,
          crop: latestYield?.crop ? String(latestYield.crop) : undefined,
          season: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          expenses: totalExpenses > 0 ? totalExpenses : undefined,
          expectedYield: latestYield ? Math.max(0, Number(latestYield.predicted_yield)) : undefined,
          notes: 'Generated from your actual farm records. Yield figures are model estimates, not confirmed harvest results.',
        }));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load your farm report.');
        setReport('');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [user?.id, user?.email, profile?.full_name]);

  const printReport = () => window.print();

  const download = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'puthumai-uzhavan-farm-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Farm Report" subtitle="Export a summary built from your actual farm records." />

      {error && (
        <GlassCard padding="md" className="border-amber-100 bg-amber-50/60">
          <div className="flex items-start gap-3 text-sm text-amber-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>
        </GlassCard>
      )}

      <GlassCard padding="lg">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 size={28} className="animate-spin text-brand-600" /><div className="mt-3 text-sm text-ink-600">Loading your farm data…</div></div>
        ) : report ? (
          <>
            <div className="flex items-center gap-3 mb-4"><FileText className="text-brand-600" /><h2 className="font-display font-bold text-ink-900">Report preview</h2></div>
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-ink-800">{report}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={printReport} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"><Printer size={16} /> Print / Save as PDF</button>
              <button onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-ink-700 hover:bg-gray-50 transition-colors"><Download size={16} /> Export text</button>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-sm text-ink-600">No report data is available yet. Add farm records and try again.</div>
        )}
      </GlassCard>
    </div>
  );
}
