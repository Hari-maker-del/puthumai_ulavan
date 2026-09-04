import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Printer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { buildFarmReportText } from '@/services/farmReportService';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';

export default function FarmReportPage() {
  const { user, profile } = useAuth();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [farmRes, expenseRes, yieldRes] = await Promise.all([
          supabase.from('farms').select('name,location').eq('user_id', user.id).limit(1).maybeSingle(),
          supabase.from('expenses').select('amount').eq('user_id', user.id),
          supabase.from('yield_predictions').select('predicted_yield,unit,crop').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);

        const farmName = farmRes.data?.name ?? undefined;
        const totalExpenses = (expenseRes.data ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
        const latestYield = yieldRes.data;

        setReport(buildFarmReportText({
          farmerName: profile?.full_name ?? user.email ?? 'Farmer',
          farmName,
          crop: latestYield?.crop ?? undefined,
          season: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          expenses: totalExpenses > 0 ? totalExpenses : undefined,
          expectedYield: latestYield ? Number(latestYield.predicted_yield) : undefined,
          notes: 'Generated from your actual farm records. Review before using for financial or agricultural decisions.',
        }));
      } catch {
        setReport(buildFarmReportText({
          farmerName: profile?.full_name ?? user.email ?? 'Farmer',
          notes: 'Farm data could not be loaded. Please try again.',
        }));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id, user?.email, profile?.full_name]);

  const printReport = () => window.print();

  const download = () => {
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
      <PageHeader icon={FileText} title="Farm Report" subtitle="Export a season summary built from your actual farm records." />

      <GlassCard padding="lg">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-600" />
            <div className="mt-3 text-sm text-ink-600">Loading your farm data…</div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-brand-600" />
              <h2 className="font-display font-bold text-ink-900">Report preview</h2>
            </div>
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-ink-800">{report}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={printReport} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
                <Printer size={16} /> Print / Save as PDF
              </button>
              <button onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-ink-700 hover:bg-gray-50 transition-colors">
                <Download size={16} /> Export text
              </button>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
