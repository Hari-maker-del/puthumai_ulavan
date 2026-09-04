import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function AIAssistantQuickPanel() {
  return (
    <GlassCard padding="lg" className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-brand-600 grid place-items-center flex-shrink-0">
            <Bot size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink-900">AI Assistant</div>
            <div className="text-[11px] text-ink-500">Live farm-aware assistant</div>
          </div>
        </div>
        <Sparkles size={16} className="text-brand-600 shrink-0" />
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-600 flex-1">
        Ask about your crops, soil, weather, expenses or verified market records. The assistant uses the farm data available to your account.
      </p>
      <Link to="/dashboard/chatbot" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-brand-200 text-brand-700 py-2.5 text-xs font-semibold hover:bg-brand-50 transition-colors">
        Open AI Assistant <ArrowRight size={13} />
      </Link>
    </GlassCard>
  );
}
