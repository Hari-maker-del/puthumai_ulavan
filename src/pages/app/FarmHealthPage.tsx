import { useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CloudSun, Database, WalletCards } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { calculateFarmHealth } from '@/services/farmHealthScoreService';
import Skeleton from '@/components/ui/Skeleton';

const icons = {
  'Crop health': Activity,
  'Field tasks': CheckCircle2,
  'Risk alerts': AlertTriangle,
  'Expense pressure': WalletCards,
  'Farm data completeness': Database,
  'Weather risk': CloudSun,
} as const;

export default function FarmHealthPage() {
  const { data, loading, error } = useDashboard();

  const result = useMemo(() => {
    if (!data) return null;
    const avgHealth = data.kpis.avgHealth ?? (
      data.fields.length
        ? data.fields.reduce((sum, field) => sum + field.health, 0) / data.fields.length
        : 0
    );
    const highPriority = data.tasks.filter(task => !task.done && task.priority === 'high').length;
    const activeAlerts = data.notifications.filter(item => item.type === 'weather' || item.type === 'crop').length;
    const expensePressure = data.finance.expectedRevenue > 0
      ? Math.min(1, data.finance.totalExpenses / data.finance.expectedRevenue)
      : 0;
    const completeness = data.fields.length ? Math.min(1, data.fields.filter(f => f.name && f.crop && f.area).length / data.fields.length) : 0.5;
    return calculateFarmHealth({
      averageCropHealth: avgHealth,
      openHighPriorityTasks: highPriority,
      activeAlerts,
      expensePressure,
      dataCompleteness: completeness,
      weatherRisk: data.weather?.today?.rainProbability ? data.weather.today.rainProbability / 100 : 0,
    });
  }, [data]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Farm health data could not be loaded. Please try again.</div>;
  if (!result) return null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-brand-700">Farm readiness</p>
        <h1 className="text-3xl font-bold text-ink-900">Farm Health Center</h1>
        <p className="mt-1 text-sm text-ink-600">A transparent score built from your current farm dashboard data.</p>
      </header>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="grid h-36 w-36 shrink-0 place-items-center rounded-full border-8 border-brand-100">
            <div className="text-center">
              <div className="text-4xl font-black text-brand-700">{result.score}</div>
              <div className="text-xs font-semibold text-ink-600">/ 100</div>
            </div>
          </div>
          <div>
            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{result.label}</span>
            <h2 className="mt-3 text-xl font-bold">What is driving your score?</h2>
            <p className="mt-1 text-sm text-ink-600">This is a decision-support indicator, not a scientific crop diagnosis.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {result.factors.map(factor => {
          const Icon = icons[factor.name as keyof typeof icons];
          return (
            <article key={factor.name} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={18} /></div>
                  <div><h3 className="font-semibold">{factor.name}</h3><p className="mt-1 text-xs text-ink-600">{factor.detail}</p></div>
                </div>
                <span className="text-lg font-bold">{Math.round(factor.score)}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${factor.score}%` }} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
