import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, CloudRain, Droplets, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { buildCopilotContext } from '@/services/aiCopilotService';
import { askGemini } from '@/services/geminiService';
import { buildFarmerMemoryContext, getFarmerMemory } from '@/services/farmerMemoryService';

const DEFAULT_PLAN = [
  { title: 'Inspect your crop', detail: 'Walk through the active field and check leaves, moisture and visible pest symptoms.', icon: CheckCircle2 },
  { title: 'Check irrigation', detail: 'Review soil moisture before irrigating. Avoid unnecessary watering after rainfall.', icon: Droplets },
  { title: 'Review weather', detail: 'Use the Weather page for the latest available forecast before spraying or fertilising.', icon: CloudRain },
];

export default function DailyFarmPlanPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceNote, setSourceNote] = useState('General farm checklist — generate a personalized plan for your farm.');
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const generate = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setAiUnavailable(false);
    try {
      const context = await buildCopilotContext(user.id);
      const memory = await getFarmerMemory(user.id);
      const prompt = `Create a practical "Today's Farm Plan" for this farmer.
Use only the supplied farm context. Do not invent live data.
Return 5 numbered actions. For each action include:
- action
- why it matters
- when today
- warning if relevant
Keep it concise and farmer-friendly.
If weather, market or yield data is unavailable, explicitly say so instead of guessing.
${context.assembled}`;
      const response = await askGemini(prompt, buildFarmerMemoryContext(memory), memory?.preferred_language ?? 'en');
      // Defensive guard for older providers/wrappers that may return a raw provider error as text.
      if (/^\s*(gemini\s+error|\{\s*["']?error|error\s*:\s*\{)/i.test(response)) {
        throw new Error('AI provider error');
      }
      setPlan(response);
      setSourceNote('Personalized using the farmer profile and the live farm context that was available.');
    } catch (error) {
      // Never expose provider errors, status codes, JSON, model names, or API details to farmers.
      console.error('Daily farm plan generation failed:', error);
      setPlan('');
      setAiUnavailable(true);
      setSourceNote('The AI plan is temporarily unavailable. Your farm data is safe. The safe checklist below is still available.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { if (user?.id) void generate(); }, [user?.id, generate]);

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarCheck} title="Today's Farm Plan" subtitle="A simple daily action plan based on your farm profile and available data." />

      <GlassCard padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={19} className="text-brand-600" />
              <h2 className="font-display font-bold text-lg text-ink-900">Personalized farm co-pilot</h2>
            </div>
            <p className="text-xs text-ink-500 mt-1">{sourceNote}</p>
          </div>
          <Button onClick={() => void generate()} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Generating…' : 'Refresh plan'}
          </Button>
        </div>
      </GlassCard>

      {aiUnavailable ? (
        <GlassCard padding="lg" className="border-rose-100 bg-rose-50/70">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">AI plan temporarily unavailable</p>
              <p className="text-sm text-rose-800 mt-1">We could not generate your personalized plan right now. Your farm data is safe. Please try again in a few moments.</p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {plan ? (
        <GlassCard padding="lg">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-ink-800">{plan}</div>
        </GlassCard>
      ) : null}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarCheck size={18} className="text-brand-600" />
          <h2 className="font-display font-bold text-lg text-ink-900">Safe daily checklist</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {DEFAULT_PLAN.map(({ title, detail, icon: Icon }) => (
            <GlassCard key={title} padding="lg">
              <Icon size={22} className="text-brand-600" />
              <div className="font-semibold text-ink-900 mt-3">{title}</div>
              <p className="text-sm text-ink-600 mt-1">{detail}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard padding="lg" className="border-amber-100 bg-amber-50/60">
        <div className="flex gap-3">
          <AlertTriangle size={19} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            Farm plans are decision support, not a replacement for a local agricultural officer or KVK/TNAU advice. Never apply a pesticide or fertilizer solely from an AI suggestion; verify the product label and local recommendation first.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
