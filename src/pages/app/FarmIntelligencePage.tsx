import React from 'react';
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  Database,
  IndianRupee,
  Leaf,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  CloudRain,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

const statuses = [
  ['Farmer memory', 'Personalized', 'User-provided'],
  ['Crop lifecycle', 'Calculated from planting date when available', 'Derived'],
  ['Weather', 'Live/cached depending on provider availability', 'External data'],
  ['Market', 'Verified records only', 'External data'],
  ['Finance', 'Recorded farm expenses', 'User data'],
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FarmIntelligencePage() {
  const { data, loading, error } = useDashboard();

  const topCrop = data?.cropStatus?.[0];
  const urgentTask = data?.tasks?.find((task) => !task.done && task.priority === 'high')
    ?? data?.tasks?.find((task) => !task.done);
  const latestAlert = data?.notifications?.[0];

  const suggestedAction = topCrop
    ? `${topCrop.name} is in the ${topCrop.stage} stage. Use the crop lifecycle guidance for this stage and verify conditions before taking action.`
    : data?.weather?.today?.rainProbability !== undefined && data.weather.today.rainProbability >= 60
      ? `Rain probability is ${data.weather.today.rainProbability}%. Review irrigation needs before scheduling additional watering.`
      : urgentTask
        ? `Your next farm task is “${urgentTask.title}” for ${urgentTask.field}. Review the task before acting.`
        : 'Add farm and crop information to receive context-based recommendations.';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600">Puthumai Uzhavan 3.0</p>
        <h1 className="text-3xl font-bold">AI Farm Intelligence</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          One intelligence layer connecting your farmer profile, crop lifecycle, weather, market and finance data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <Brain className="mb-3 text-emerald-600" />
          <h2 className="font-semibold">Farm-aware AI</h2>
          <p className="mt-1 text-sm text-slate-600">Recommendations should use only context actually available to the application.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <Database className="mb-3 text-blue-600" />
          <h2 className="font-semibold">Data provenance</h2>
          <p className="mt-1 text-sm text-slate-600">Live, cached, estimate and demo information are explicitly distinguishable.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <ShieldCheck className="mb-3 text-amber-600" />
          <h2 className="font-semibold">AI safety</h2>
          <p className="mt-1 text-sm text-slate-600">High-impact advice should be verified before the farmer acts on it.</p>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="text-emerald-600" />
          <div>
            <h2 className="font-semibold">Current farm insights</h2>
            <p className="text-xs text-slate-500">Based only on data currently available to your account.</p>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
            Loading your farm intelligence…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Farm insights are temporarily unavailable.</p>
              <p className="mt-1">Please check your connection and try again. No sample farm values are shown.</p>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-emerald-700"><Leaf className="h-5 w-5" /><span className="text-sm font-medium">Crop status</span></div>
              {topCrop ? (
                <><p className="mt-3 font-semibold">{topCrop.name}</p><p className="text-sm text-slate-600">{topCrop.stage} · {topCrop.daysToHarvest} days to harvest</p><p className="mt-1 text-xs text-slate-500">Health: {topCrop.health}% · {topCrop.field}</p></>
              ) : <p className="mt-3 text-sm text-slate-500">No crop records available yet.</p>}
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-blue-700"><CloudRain className="h-5 w-5" /><span className="text-sm font-medium">Weather impact</span></div>
              <p className="mt-3 font-semibold">{data.weather?.location || 'Weather unavailable'}</p>
              <p className="text-sm text-slate-600">{data.weather?.today?.temp ?? '—'}° · Rain {data.weather?.today?.rainProbability ?? '—'}%</p>
              <p className="mt-1 text-xs text-slate-500">Source: {data.weather?.source === 'open-meteo' ? 'Live Open-Meteo' : 'Reported source unavailable'}</p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-amber-700"><CalendarClock className="h-5 w-5" /><span className="text-sm font-medium">Next farm action</span></div>
              {urgentTask ? (
                <><p className="mt-3 font-semibold">{urgentTask.title}</p><p className="text-sm text-slate-600">{urgentTask.field} · Due {urgentTask.due}</p><p className="mt-1 text-xs capitalize text-slate-500">{urgentTask.priority} priority</p></>
              ) : <p className="mt-3 text-sm text-slate-500">No open tasks recorded.</p>}
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-violet-700"><TrendingUp className="h-5 w-5" /><span className="text-sm font-medium">Farm health</span></div>
              <p className="mt-3 text-2xl font-bold">{data.kpis.avgHealth}%</p>
              <p className="text-sm text-slate-600">Average health across recorded fields</p>
              <p className="mt-1 text-xs text-slate-500">{data.kpis.activeFields} active fields · {data.kpis.totalAcreage} acres</p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-rose-700"><IndianRupee className="h-5 w-5" /><span className="text-sm font-medium">Finance outlook</span></div>
              <p className="mt-3 font-semibold">{formatCurrency(data.finance.expectedProfit)}</p>
              <p className="text-sm text-slate-600">Expected profit from recorded farm data</p>
              <p className="mt-1 text-xs text-slate-500">Margin: {data.finance.profitMargin}%</p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-orange-700"><AlertTriangle className="h-5 w-5" /><span className="text-sm font-medium">Latest alert</span></div>
              {latestAlert ? (
                <><p className="mt-3 font-semibold">{latestAlert.title}</p><p className="text-sm text-slate-600">{latestAlert.detail}</p><p className="mt-1 text-xs text-slate-500">{latestAlert.time}</p></>
              ) : <p className="mt-3 text-sm text-slate-500">No alerts recorded.</p>}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-slate-900">Suggested next action</h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">{suggestedAction}</p>
            <p className="mt-2 text-xs text-slate-500">Verify local field conditions and trusted agricultural guidance before high-impact decisions.</p>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><Sparkles className="text-emerald-600" /><h2 className="font-semibold">Data used by the farm brain</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {statuses.map(([name, value, source]) => (
            <div key={name} className="rounded-xl border p-4">
              <p className="font-medium">{name}</p><p className="text-sm text-slate-600">{value}</p><p className="mt-1 text-xs text-slate-400">{source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
