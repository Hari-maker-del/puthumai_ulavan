import { useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CloudRain, Database, Droplets, MapPinned, ShieldCheck, Sprout, WalletCards, Wind } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { calculateFarmHealth } from '@/services/farmHealthScoreService';
import Skeleton from '@/components/ui/Skeleton';

function healthTone(score: number) {
  if (score >= 80) return 'bg-brand-50 text-brand-700';
  if (score >= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

export default function FarmHealthPage() {
  const { data, loading, error, refresh } = useDashboard();

  const view = useMemo(() => {
    if (!data) return null;
    const fields = data.fields;
    const activeFields = fields.length;
    const averageCropHealth = activeFields ? fields.reduce((sum, field) => sum + Number(field.health || 0), 0) / activeFields : data.kpis.avgHealth;
    const openTasks = data.tasks.filter(task => !task.done).length;
    const highPriorityTasks = data.tasks.filter(task => !task.done && task.priority === 'high').length;
    const activeAlerts = data.notifications.filter(item => item.type === 'weather' || item.type === 'crop').length;
    const weatherRisk = data.weather?.today ? Math.min(1, Math.max(0, (data.weather.today.rainProbability ?? 0) / 100)) : 0;
    const expensePressure = data.finance.expectedRevenue > 0 ? Math.min(1, Math.max(0, data.finance.totalExpenses / data.finance.expectedRevenue)) : 0;
    const completeness = activeFields ? fields.filter(field => field.name && field.crop && field.area).length / activeFields : 0.5;
    const result = calculateFarmHealth({ averageCropHealth, openHighPriorityTasks: highPriorityTasks, activeAlerts, expensePressure, dataCompleteness: completeness, weatherRisk });
    const healthy = fields.filter(field => Number(field.health) >= 80).length;
    const attention = fields.filter(field => Number(field.health) >= 60 && Number(field.health) < 80).length;
    const atRisk = fields.filter(field => Number(field.health) < 60).length;
    const total = Math.max(healthy + attention + atRisk, 1);
    const healthyDeg = (healthy / total) * 360;
    const attentionDeg = (attention / total) * 360;
    const actions: string[] = [];
    if (atRisk) actions.push(`Check ${atRisk} field${atRisk > 1 ? 's' : ''} marked at risk.`);
    if (activeAlerts) actions.push(`Review ${activeAlerts} active crop or weather alert${activeAlerts > 1 ? 's' : ''}.`);
    if (openTasks) actions.push(`Complete ${openTasks} open farm task${openTasks > 1 ? 's' : ''}.`);
    if (weatherRisk > 0.5) actions.push('Review field work before operating in the current rain risk.');
    if (!actions.length) actions.push('No immediate health action is flagged from the current farm data.');
    return { result, activeFields, averageCropHealth: Math.round(averageCropHealth || 0), openTasks, activeAlerts, healthy, attention, atRisk, total, healthyDeg, attentionDeg, actions };
  }, [data]);

  if (loading) return <div className="space-y-5"><Skeleton className="h-8 w-64" /><Skeleton className="h-72 w-full" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Farm health data could not be loaded. Please try again.</div>;
  if (!data || !view) return null;

  const ring = `conic-gradient(#16a34a 0deg ${view.healthyDeg}deg, #f59e0b ${view.healthyDeg}deg ${view.healthyDeg + view.attentionDeg}deg, #ef4444 ${view.healthyDeg + view.attentionDeg}deg 360deg)`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-semibold text-brand-700">Current farm condition</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">Farm Health Center</h1><p className="mt-2 max-w-2xl text-sm text-ink-600">Simple visual health information from your current farm records, crop condition, weather, alerts and tasks.</p></div>
        <button onClick={() => void refresh()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-sm hover:bg-gray-50">Refresh health data</button>
      </header>

      <section className="grid gap-6 rounded-3xl border bg-white p-6 shadow-sm lg:grid-cols-[1fr_1.1fr] lg:p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="relative grid h-64 w-64 place-items-center rounded-full p-3" style={{ background: ring }}>
            <div className="grid h-full w-full place-items-center rounded-full bg-white shadow-inner">
              <div className="text-center"><div className="text-5xl font-black text-brand-700">{view.result.score}</div><div className="mt-1 text-sm font-bold text-ink-500">FARM HEALTH / 100</div><div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"><ShieldCheck size={14} /> {view.result.label}</div></div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-semibold text-ink-700">At a glance: your field health</p>
          <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl bg-brand-50 p-3"><div className="text-xl font-black text-brand-700">{view.healthy}</div><div className="mt-1 font-semibold text-brand-700">Healthy</div></div>
            <div className="rounded-xl bg-amber-50 p-3"><div className="text-xl font-black text-amber-700">{view.attention}</div><div className="mt-1 font-semibold text-amber-700">Attention</div></div>
            <div className="rounded-xl bg-red-50 p-3"><div className="text-xl font-black text-red-700">{view.atRisk}</div><div className="mt-1 font-semibold text-red-700">At risk</div></div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="rounded-2xl bg-gray-50 p-5"><div className="flex items-center gap-3"><Activity className="text-brand-700" size={20} /><div><h2 className="font-bold text-ink-900">What does this mean?</h2><p className="text-xs text-ink-500">The score combines current farm signals.</p></div></div><p className="mt-4 text-sm leading-6 text-ink-600">{view.result.label} means the farm currently has a {view.result.label.toLowerCase()} readiness level based on the information recorded in your account. This is a decision-support indicator, not a scientific crop diagnosis.</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs text-ink-500">Fields</p><p className="mt-1 text-2xl font-black">{view.activeFields}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-ink-500">Avg crop health</p><p className="mt-1 text-2xl font-black">{view.averageCropHealth}%</p></div><div className="rounded-xl border p-4"><p className="text-xs text-ink-500">Alerts</p><p className="mt-1 text-2xl font-black">{view.activeAlerts}</p></div></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><MapPinned className="text-brand-700" size={20} /><div><h2 className="font-bold text-ink-900">Field-wise health</h2><p className="text-xs text-ink-500">Current stored health for each field</p></div></div>
          {data.fields.length ? <div className="mt-4 divide-y">{data.fields.map(field => <div key={field.name} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink-900">{field.name}</span><span className="text-xs text-ink-500">{field.crop} · {field.area}</span></div><p className="mt-1 text-xs text-ink-500">Stage: {field.stage || 'Not recorded'}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${healthTone(field.health)}`}>{Math.round(field.health)}% health</span></div>)}</div> : <div className="mt-4 rounded-xl bg-gray-50 p-5 text-sm text-ink-600">No field health records are available yet.</div>}
        </article>

        <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><AlertTriangle className="text-brand-700" size={20} /><div><h2 className="font-bold text-ink-900">What needs attention?</h2><p className="text-xs text-ink-500">Simple next actions</p></div></div><div className="mt-4 space-y-3">{view.actions.map(action => <div key={action} className="flex gap-3 rounded-xl bg-gray-50 p-4 text-sm text-ink-700"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-700" /><span>{action}</span></div>)}</div></article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><Droplets size={18} /><span className="text-xs font-bold uppercase">Water & weather</span></div><p className="mt-3 font-semibold text-ink-900">{data.weather?.today?.condition ?? 'Weather not available'}</p><p className="mt-1 text-sm text-ink-600">{data.weather ? `${Math.round(data.weather.today.temp)}°C · ${data.weather.today.humidity}% humidity` : 'Add a farm location to load weather.'}</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><Wind size={18} /><span className="text-xs font-bold uppercase">Wind</span></div><p className="mt-3 text-xl font-black text-ink-900">{data.weather ? `${Math.round(data.weather.today.wind)} km/h` : '—'}</p><p className="mt-1 text-sm text-ink-600">Current weather signal</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><WalletCards size={18} /><span className="text-xs font-bold uppercase">Expense load</span></div><p className="mt-3 text-xl font-black text-ink-900">₹{Math.round(data.finance.totalExpenses).toLocaleString('en-IN')}</p><p className="mt-1 text-sm text-ink-600">Recorded farm expenses</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><Database size={18} /><span className="text-xs font-bold uppercase">Data coverage</span></div><p className="mt-3 text-xl font-black text-ink-900">{Math.round(view.result.factors.find(f => f.name === 'Farm data completeness')?.score ?? 0)}%</p><p className="mt-1 text-sm text-ink-600">Available field context</p></div>
      </section>

      <footer className="rounded-2xl border bg-gray-50 p-5 text-xs leading-5 text-ink-500">Farm Health uses live authenticated farm data already collected by the application. No sample field measurements are added by this page.</footer>
    </div>
  );
}
