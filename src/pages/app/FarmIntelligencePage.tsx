import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  CloudRain,
  Database,
  IndianRupee,
  Leaf,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function safePercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

type WeatherSignalTone = 'green' | 'blue' | 'amber' | 'slate';

type WeatherSignal = {
  title: string;
  detail: string;
  tone: WeatherSignalTone;
  action: string;
};

function getWeatherSignal(data: NonNullable<ReturnType<typeof useDashboard>['data']>): WeatherSignal {
  const today = data.weather?.today;
  if (!today) {
    return {
      title: 'Weather signal unavailable',
      detail: 'Live weather is not available for the farm location right now.',
      tone: 'slate',
      action: 'Use local field conditions until live weather returns.',
    };
  }

  if ((today.rainProbability ?? 0) >= 60) {
    return {
      title: 'Rain may affect field work',
      detail: `${today.rainProbability}% rain probability today. Review irrigation and spraying before scheduling work.`,
      tone: 'blue',
      action: 'Prioritize weather-sensitive decisions first.',
    };
  }

  if (today.temp >= 35) {
    return {
      title: 'Heat stress needs attention',
      detail: `Current temperature is ${today.temp}°C. Protect water availability and avoid unnecessary midday field work.`,
      tone: 'amber',
      action: 'Check crop and water conditions during cooler hours.',
    };
  }

  return {
    title: 'Weather supports farm activity',
    detail: `${today.temp}°C with ${today.rainProbability ?? '—'}% rain probability. Current conditions do not show a major weather constraint.`,
    tone: 'green',
    action: 'Proceed with routine work while verifying field conditions.',
  };
}

export default function FarmIntelligencePage() {
  const { data, loading, error, refetch } = useDashboard();

  const topCrop = data?.cropStatus?.[0];
  const openTasks = data?.tasks?.filter((task) => !task.done) ?? [];
  const urgentTask =
    openTasks.find((task) => task.priority === 'high') ??
    openTasks[0] ??
    null;
  const latestAlert = data?.notifications?.[0] ?? null;
  const weatherSignal = data ? getWeatherSignal(data) : null;

  const health = safePercent(data?.kpis.avgHealth ?? 0);
  const profit = data?.finance.expectedProfit ?? 0;
  const revenue = data?.finance.expectedRevenue ?? 0;

  const decisions: Array<{
    title: string;
    reason: string;
    action: string;
    tone: 'green' | 'amber' | 'blue' | 'rose';
    icon: React.ElementType;
  }> = [];

  if (weatherSignal) {
    decisions.push({
      title: weatherSignal.title,
      reason: weatherSignal.detail,
      action: weatherSignal.action,
      tone: weatherSignal.tone === 'blue' ? 'blue' : weatherSignal.tone === 'amber' ? 'amber' : weatherSignal.tone === 'green' ? 'green' : 'rose',
      icon: CloudRain,
    });
  }

  if (topCrop) {
    decisions.push({
      title: `Review ${topCrop.name} — ${topCrop.stage}`,
      reason: `${topCrop.field} is recorded at ${topCrop.health}% health.`,
      action: topCrop.health < 60
        ? 'Inspect the crop closely and use Crop Monitoring for detailed diagnosis.'
        : 'Continue stage-appropriate work and monitor crop health for changes.',
      tone: topCrop.health < 60 ? 'rose' : 'green',
      icon: Sprout,
    });
  }

  if (urgentTask) {
    decisions.push({
      title: `Next priority: ${urgentTask.title}`,
      reason: `${urgentTask.field} · Due ${urgentTask.due}.`,
      action: 'Open the farm task workflow and confirm the field condition before completing it.',
      tone: urgentTask.priority === 'high' ? 'amber' : 'blue',
      icon: CalendarClock,
    });
  }

  if (latestAlert && decisions.length < 4) {
    decisions.push({
      title: latestAlert.title,
      reason: latestAlert.detail,
      action: 'Review the alert details before taking action.',
      tone: latestAlert.type === 'weather' ? 'blue' : 'amber',
      icon: ShieldAlert,
    });
  }

  if (!decisions.length) {
    decisions.push({
      title: 'Build your farm context',
      reason: 'Farm intelligence becomes stronger as farm, field, crop, task and weather records become available.',
      action: 'Complete your farm profile and add crop or field records.',
      tone: 'green',
      icon: Brain,
    });
  }

  const fieldSignals = (data?.fields ?? []).slice(0, 6);
  const expenseRatio = revenue > 0 ? Math.round((data?.finance.totalExpenses ?? 0) / revenue * 100) : null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50 to-emerald-100 shadow-card">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('/farm-intelligence-landscape.svg')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent" />
        <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur">
            <Brain className="h-4 w-4" />
            Decision intelligence
          </div>
          <h1 className="text-3xl font-bold text-emerald-950 sm:text-4xl">Farm Intelligence</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-700">
            Turn your real farm records, crop status, tasks, weather and financial data into clear decisions.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full bg-white/85 px-3 py-2">Real farm data</span>
            <span className="rounded-full bg-white/85 px-3 py-2">Context-aware analysis</span>
            <span className="rounded-full bg-white/85 px-3 py-2">Action before information</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Farm context</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {data?.farmerProfile.name ?? 'Your farm'}
            </h2>
            <p className="text-sm text-slate-500">
              {data?.farmerProfile.location ?? 'Location not recorded'} · {data?.kpis.totalAcreage ?? 0} acres · {data?.kpis.activeFields ?? 0} active fields
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {topCrop && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                <Leaf className="h-4 w-4" /> {topCrop.name} · {topCrop.stage}
              </span>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh intelligence
            </button>
          </div>
        </div>
      </section>

      {loading && (
        <section className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl border bg-white" />
          ))}
        </section>
      )}

      {!loading && error && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Farm intelligence is temporarily unavailable.</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && data && (
        <>
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Signals</p>
                <h2 className="text-xl font-bold text-slate-900">What the farm data is saying</h2>
              </div>
              <span className="text-xs text-slate-500">Derived from current records</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity className="h-5 w-5" /></div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Crop signal</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{topCrop ? `${topCrop.name} · ${topCrop.stage}` : 'No crop signal yet'}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {topCrop ? `${topCrop.field} is recorded at ${topCrop.health}% health with ${topCrop.daysToHarvest} days to harvest.` : 'Add a crop record to generate crop-specific intelligence.'}
                </p>
              </article>

              <article className="rounded-2xl border border-sky-100 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><CloudRain className="h-5 w-5" /></div>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">Weather signal</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{weatherSignal?.title ?? 'Weather signal unavailable'}</h3>
                <p className="mt-1 text-sm text-slate-600">{weatherSignal?.detail ?? 'No weather data is currently available for analysis.'}</p>
              </article>

              <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><Target className="h-5 w-5" /></div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Action signal</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{urgentTask ? urgentTask.title : 'No open priority task'}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {urgentTask ? `${urgentTask.field} · due ${urgentTask.due}.` : 'The current account has no unfinished farm task records.'}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
                  {openTasks.length} open task{openTasks.length === 1 ? '' : 's'} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </article>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                  <Sparkles className="h-4 w-4" /> Intelligence engine
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Recommended decisions</h2>
                <p className="mt-1 text-sm text-slate-600">Prioritized from the data currently available — not from sample values.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs text-slate-500">Recorded farm health</p>
                <p className="text-2xl font-bold text-emerald-700">{health}%</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {decisions.slice(0, 4).map((decision, index) => {
                const Icon = decision.icon;
                const toneClasses = {
                  green: 'border-emerald-200 bg-white',
                  amber: 'border-amber-200 bg-white',
                  blue: 'border-sky-200 bg-white',
                  rose: 'border-rose-200 bg-white',
                }[decision.tone];
                const iconClasses = {
                  green: 'bg-emerald-50 text-emerald-700',
                  amber: 'bg-amber-50 text-amber-700',
                  blue: 'bg-sky-50 text-sky-700',
                  rose: 'bg-rose-50 text-rose-700',
                }[decision.tone];

                return (
                  <article key={`${decision.title}-${index}`} className={`rounded-2xl border p-5 ${toneClasses}`}>
                    <div className="flex gap-4">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconClasses}`}><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Decision {index + 1}</span>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h3 className="mt-1 font-semibold text-slate-900">{decision.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{decision.reason}</p>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                          <span className="font-semibold text-slate-800">Recommended action: </span>
                          <span className="text-slate-600">{decision.action}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-5">
            <article className="lg:col-span-3 rounded-2xl border bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Field intelligence</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Field-by-field signals</h2>
                </div>
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>

              {fieldSignals.length ? (
                <div className="mt-4 space-y-3">
                  {fieldSignals.map((field) => (
                    <div key={field.name} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{field.name}</p>
                          <p className="text-xs text-slate-500">{field.crop} · {field.stage} · {field.area}</p>
                        </div>
                        <div className="min-w-32">
                          <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Health</span><span>{field.health}%</span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${safePercent(field.health)}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed p-5 text-sm text-slate-500">No field records are available yet.</div>
              )}
            </article>

            <article className="lg:col-span-2 rounded-2xl border bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Financial signal</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Farm economics</h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Recorded expenses</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(data.finance.totalExpenses)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-slate-500">Expected revenue</p>
                    <p className="mt-1 font-bold text-slate-900">{formatCurrency(revenue)}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-slate-500">Expected profit</p>
                    <p className={`mt-1 font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(profit)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    {profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {expenseRatio === null ? 'Revenue data not yet recorded' : `${expenseRatio}% of recorded revenue is covered by expenses`}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-amber-800">This is a calculated signal from recorded finance records, not a forecast guarantee.</p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border bg-slate-950 p-5 text-white shadow-soft sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-300"><Database className="h-5 w-5" /><span className="text-sm font-semibold">Intelligence provenance</span></div>
                <h2 className="mt-2 text-xl font-bold">What this module uses</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  Farm Intelligence is an analysis layer. It does not replace Crop Recommendation, Crop Monitoring, Weather, Expenses or the AI Assistant.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                {[
                  ['Farm & fields', Boolean(data.kpis.activeFields)],
                  ['Crop records', Boolean(data.cropStatus.length)],
                  ['Weather', Boolean(data.weather)],
                  ['Tasks', Boolean(data.tasks.length)],
                  ['Alerts', Boolean(data.notifications.length)],
                  ['Finance', Boolean(data.finance.totalExpenses || data.finance.expectedRevenue)],
                ].map(([label, available]) => (
                  <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span className="text-slate-200">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
