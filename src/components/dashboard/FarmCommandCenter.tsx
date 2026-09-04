import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, CloudRain, Coins, HeartPulse, Leaf, Loader2, RefreshCw, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { buildCopilotContext, type CopilotContext } from '@/services/aiCopilotService';
import { askGemini } from '@/services/geminiService';
import { buildFarmerMemoryContext } from '@/services/farmerMemoryService';
import { buildFarmActions, type FarmAction } from '@/services/farmDecisionService';

const priorityClasses = {
  high: 'border-red-100 bg-red-50 text-red-700',
  medium: 'border-amber-100 bg-amber-50 text-amber-700',
  low: 'border-gray-100 bg-gray-50 text-ink-600',
} as const;

function actionIcon(action: FarmAction) {
  if (action.source === 'weather') return CloudRain;
  if (action.source === 'market') return TrendingUp;
  if (action.source === 'finance') return Coins;
  if (action.source === 'profile') return Leaf;
  return HeartPulse;
}

function buildDataOnlyBriefing(context: CopilotContext): string {
  const actions = buildFarmActions(context).slice(0, 3);
  const bullets: string[] = [];
  for (const action of actions) bullets.push(`• ${action.title}: ${action.detail}`);
  if (context.weatherAvailable && context.weather?.today) {
    bullets.push(`• Weather: ${context.weather.today.condition}, ${context.weather.today.temp}°C; use the live forecast when planning field work.`);
  } else {
    bullets.push('• Weather: live weather is unavailable for the farm location right now.');
  }
  if (context.marketAvailable) {
    bullets.push('• Market: verified market records are available for the current farm context.');
  } else {
    bullets.push('• Market: no verified current market record is available, so no price claim is made.');
  }
  return bullets.slice(0, 3).join('\n');
}

export default function FarmCommandCenter() {
  const { user } = useAuth();
  const [context, setContext] = useState<CopilotContext | null>(null);
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [error, setError] = useState('');

  const loadContext = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const next = await buildCopilotContext(user.id);
      setContext(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load farm intelligence.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const generateBriefing = useCallback(async () => {
    if (!context) return;
    setBriefingLoading(true);
    try {
      const prompt = `Create a concise farm command-center briefing for today. Use only this supplied context. Return exactly 3 short bullets: (1) most important farm action, (2) weather/crop risk, (3) money/market opportunity if verified data exists. Never invent live prices, weather or yield. If data is unavailable, say so. ${context.assembled}`;
      const result = await askGemini(prompt, buildFarmerMemoryContext(context.farmerMemory), context.farmerMemory?.preferred_language ?? 'en');
      setBriefing(result);
    } catch (err) {
      const fallback = buildDataOnlyBriefing(context);
      setBriefing(fallback || (err instanceof Error ? err.message : 'AI briefing could not be generated.'));
    } finally {
      setBriefingLoading(false);
    }
  }, [context]);

  useEffect(() => { void loadContext(); }, [loadContext]);
  useEffect(() => { if (context) void generateBriefing(); }, [context, generateBriefing]);

  const actions = useMemo(() => context ? buildFarmActions(context) : [], [context]);
  const weather = context?.weather?.today;

  return (
    <GlassCard padding="lg" className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
            <Sparkles size={13} /> AI Farm Command Center
          </div>
          <h2 className="font-display font-bold text-xl text-ink-900 mt-3">What needs your attention today?</h2>
          <p className="text-xs text-ink-500 mt-1">One view combining your farm memory, weather, crop stage, market records and spending.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadContext()} disabled={loading}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      ) : null}

      <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-4 mt-5">
        <div className="rounded-2xl bg-ink-900 p-5 text-white">
          <div className="flex items-center gap-2 text-brand-200 text-xs font-semibold"><Bot size={16} /> AI briefing</div>
          {briefingLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-300 mt-4"><Loader2 size={16} className="animate-spin" /> Building your briefing…</div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-6 text-gray-100 mt-4">{briefing || 'Complete your farm profile to unlock a more personalized briefing.'}</div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Live context</div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl bg-sky-50 p-3"><div className="text-xs text-sky-700">Weather</div><div className="font-bold text-lg text-sky-900 mt-1">{weather ? `${weather.temp}°C` : '—'}</div><div className="text-[10px] text-sky-700">{weather?.condition ?? 'Unavailable'}</div></div>
            <div className="rounded-xl bg-brand-50 p-3"><div className="text-xs text-brand-700">Market</div><div className="font-bold text-lg text-brand-900 mt-1">{context?.marketAvailable ? 'Verified' : '—'}</div><div className="text-[10px] text-brand-700">{context?.marketAvailable ? 'records found' : 'no live record'}</div></div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2"><AlertTriangle size={17} className="text-amber-600" /><h3 className="font-semibold text-ink-900">Priority actions</h3></div>
          <Link to="/dashboard/daily-plan" className="text-xs font-semibold text-brand-700 inline-flex items-center gap-1">Open daily plan <ArrowRight size={13} /></Link>
        </div>
        {actions.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {actions.map((action) => {
              const Icon = actionIcon(action);
              return <div key={action.id} className={`rounded-xl border p-4 ${priorityClasses[action.priority]}`}>
                <div className="flex items-start gap-3"><Icon size={18} className="shrink-0 mt-0.5" /><div><div className="font-semibold text-sm">{action.title}</div><p className="text-xs mt-1 leading-5 opacity-90">{action.detail}</p></div></div>
              </div>;
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 p-4 text-sm text-ink-600">Add your crop, stage and farm details to generate personalized actions.</div>
        )}
      </div>
    </GlassCard>
  );
}
