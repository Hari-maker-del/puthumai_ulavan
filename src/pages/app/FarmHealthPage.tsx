import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Database,
  Droplets,
  MapPinned,
  ShieldCheck,
  Sprout,
  WalletCards,
  Wind,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { calculateFarmHealth } from '@/services/farmHealthScoreService';
import Skeleton from '@/components/ui/Skeleton';

const factorIcons = {
  'Crop health': Sprout,
  'Field tasks': CheckCircle2,
  'Risk alerts': AlertTriangle,
  'Expense pressure': WalletCards,
  'Farm data completeness': Database,
  'Weather risk': CloudRain,
} as const;

function scoreText(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Watch';
  return 'At Risk';
}

function healthTone(score: number) {
  if (score >= 80) return 'bg-brand-50 text-brand-700';
  if (score >= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

export default function FarmHealthPage() {
  const { data, loading, error, refresh } = useDashboard();

  const view = useMemo(() => {
    if (!data) return null;

    const activeFields = data.fields.length;
    const averageCropHealth = activeFields
      ? data.fields.reduce((sum, field) => sum + Number(field.health || 0), 0) / activeFields
      : data.kpis.avgHealth;

    const openTasks = data.tasks.filter(task => !task.done).length;
    const highPriorityTasks = data.tasks.filter(task => !task.done && task.priority === 'high').length;
    const activeAlerts = data.notifications.filter(item => item.type === 'weather' || item.type === 'crop').length;
    const weatherRisk = data.weather?.today
      ? Math.min(1, Math.max(0, (data.weather.today.rainProbability ?? 0) / 100))
      : 0;
    const expensePressure = data.finance.expectedRevenue > 0
      ? Math.min(1, Math.max(0, data.finance.totalExpenses / data.finance.expectedRevenue))
      : 0;
    const completeness = activeFields
      ? data.fields.filter(field => field.name && field.crop && field.area).length / activeFields
      : 0.5;

    const result = calculateFarmHealth({
      averageCropHealth,
      openHighPriorityTasks: highPriorityTasks,
      activeAlerts,
      expensePressure,
      dataCompleteness: completeness,
      weatherRisk,
    });

    const weakestFactor = [...result.factors].sort((a, b) => a.score - b.score)[0];
    const criticalFields = data.fields.filter(field => Number(field.health) < 60);
    const healthyFields = data.fields.filter(field => Number(field.health) >= 80);

    const actions: string[] = [];
    if (criticalFields.length) actions.push(`Review ${criticalFields.length} field${criticalFields.length > 1 ? 's' : ''} with health below 60.`);
    if (activeAlerts) actions.push(`Check ${activeAlerts} active crop or weather alert${activeAlerts > 1 ? 's' : ''}.`);
    if (openTasks) actions.push(`Complete ${openTasks} open farm task${openTasks > 1 ? 's' : ''}.`);
    if (expensePressure > 0.7) actions.push('Review current expenses before committing to new farm inputs.');
    if (weatherRisk > 0.5) actions.push('Review field operations against the current rain risk.');
    if (!actions.length) actions.push('No immediate health action is flagged from the currently available data.');

    return {
      result,
      activeFields,
      averageCropHealth: Math.round(averageCropHealth || 0),
      openTasks,
      activeAlerts,
      criticalFields,
      healthyFields,
      weakestFactor,
      actions,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Farm health data could not be loaded. Please try again.</div>;
  }

  if (!data || !view) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Current farm condition</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">Farm Health Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            A transparent health view built from your current fields, crop records, tasks, alerts, finance and weather data.
          </p>
        </div>
        <button onClick={() => void refresh()} className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-sm hover:bg-gray-50">
          Refresh health data
        </button>
      </header>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:p-8">
          <div className="relative grid h-40 w-40 place-items-center rounded-full border-[10px] border-brand-50 bg-white">
            <div className="absolute inset-3 rounded-full border-2 border-dashed border-brand-100" />
            <div className="relative text-center">
              <div className="text-5xl font-black text-brand-700">{view.result.score}</div>
              <div className="text-xs font-bold text-ink-500">HEALTH SCORE / 100</div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <ShieldCheck size={14} /> {view.result.label}
            </div>
            <h2 className="mt-3 text-2xl font-bold text-ink-900">{view.result.label} farm readiness</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              The score summarizes the strongest current signals and the areas that need attention. It is a decision-support indicator, not a scientific crop diagnosis.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-ink-600">
              <span className="rounded-full bg-gray-50 px-3 py-1.5">{view.activeFields} active fields</span>
              <span className="rounded-full bg-gray-50 px-3 py-1.5">{view.averageCropHealth}% avg crop health</span>
              <span className="rounded-full bg-gray-50 px-3 py-1.5">{view.activeAlerts} risk alerts</span>
            </div>
          </div>
          <div className="rounded-2xl bg-brand-50 p-5 lg:min-w-56">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Priority signal</p>
            <p className="mt-2 text-lg font-bold text-ink-900">{view.weakestFactor.name}</p>
            <p className="mt-1 text-sm text-ink-600">{view.weakestFactor.detail}</p>
            <div className="mt-3 text-2xl font-black text-brand-700">{Math.round(view.weakestFactor.score)}%</div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Health signals</h2>
            <p className="text-sm text-ink-500">Each signal is calculated from current account data.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {view.result.factors.map(factor => {
            const Icon = factorIcons[factor.name as keyof typeof factorIcons];
            return (
              <article key={factor.name} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={18} /></div>
                    <div>
                      <h3 className="font-semibold text-ink-900">{factor.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-ink-500">{factor.detail}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-ink-900">{Math.round(factor.score)}%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(0, Math.min(100, factor.score))}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPinned className="text-brand-700" size={20} />
            <div><h2 className="font-bold text-ink-900">Field-wise health</h2><p className="text-xs text-ink-500">Current stored field health records</p></div>
          </div>
          {data.fields.length ? (
            <div className="mt-5 divide-y">
              {data.fields.map(field => (
                <div key={field.name} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink-900">{field.name}</span><span className="text-xs text-ink-500">{field.crop} · {field.area}</span></div>
                    <p className="mt-1 text-xs text-ink-500">Stage: {field.stage || 'Not recorded'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(0, Math.min(100, field.health || 0))}%` }} /></div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${healthTone(field.health)}`}>{Math.round(field.health)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="mt-5 rounded-xl bg-gray-50 p-5 text-sm text-ink-600">No field health records are available yet.</div>}
        </article>

        <article className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="text-brand-700" size={20} />
            <div><h2 className="font-bold text-ink-900">Immediate attention</h2><p className="text-xs text-ink-500">Actions based on current signals</p></div>
          </div>
          <div className="mt-5 space-y-3">
            {view.actions.map(action => (
              <div key={action} className="flex gap-3 rounded-xl border bg-gray-50 p-4 text-sm text-ink-700">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-brand-700" />
                <span>{action}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-ink-500">Healthy fields</p><p className="mt-1 text-2xl font-black text-ink-900">{view.healthyFields.length}</p></div>
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-ink-500">Open tasks</p><p className="mt-1 text-2xl font-black text-ink-900">{view.openTasks}</p></div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><Droplets size={18} /><span className="text-xs font-bold uppercase">Water & weather</span></div><p className="mt-3 font-semibold text-ink-900">{data.weather?.today?.condition ?? 'Weather not available'}</p><p className="mt-1 text-sm text-ink-600">{data.weather ? `${Math.round(data.weather.today.temp)}°C · ${data.weather.today.humidity}% humidity` : 'Add a farm location to load weather context.'}</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><Wind size={18} /><span className="text-xs font-bold uppercase">Wind</span></div><p className="mt-3 font-semibold text-ink-900">{data.weather ? `${Math.round(data.weather.today.wind)} km/h` : 'Not available'}</p><p className="mt-1 text-sm text-ink-600">Current weather signal</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><WalletCards size={18} /><span className="text-xs font-bold uppercase">Expense load</span></div><p className="mt-3 font-semibold text-ink-900">₹{Math.round(data.finance.totalExpenses).toLocaleString('en-IN')}</p><p className="mt-1 text-sm text-ink-600">Recorded farm expenses</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-brand-700"><Database size={18} /><span className="text-xs font-bold uppercase">Data coverage</span></div><p className="mt-3 font-semibold text-ink-900">{Math.round(view.result.factors.find(f => f.name === 'Farm data completeness')?.score ?? 0)}%</p><p className="mt-1 text-sm text-ink-600">Available field context</p></div>
      </section>

      <footer className="rounded-2xl border bg-gray-50 p-5 text-xs leading-5 text-ink-500">
        Farm Health uses the same authenticated dashboard data used across the application, including fields, tasks, crop/weather alerts, financial activity and weather context. Values are live account data; no sample farm measurements are added by this page.
      </footer>
    </div>
  );
}
