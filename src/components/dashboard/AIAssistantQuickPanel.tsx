import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as aiConversationService from '@/services/aiConversationService';

// tagColors and tagIcons removed to avoid unused-variable lint errors; suggestions are driven by live data.

export default function AIAssistantQuickPanel() {
  const { user } = useAuth();
  const { data: summaries, loading } = useApiQuery(
    () => (user?.id ? aiConversationService.getConversationSummaries(user.id) : Promise.resolve([])),
    Boolean(user?.id),
  );

  const aiSuggestions = summaries ?? [];

  return (
    <div className="bg-white rounded-xl shadow-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-brand-600 grid place-items-center flex-shrink-0">
            <Bot size={17} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-ink-900">AI Assistant</div>
            <div className="text-[11px] text-ink-500">Today's smart suggestions</div>
          </div>
        </div>
        <Link
          to="/dashboard/chatbot"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          Open chat <ArrowRight size={12} />
        </Link>
      </div>

      {/* Suggestions */}
      <div className="space-y-2.5 flex-1">
        {loading ? (
          <div className="text-center text-sm text-ink-600 py-6">Loading…</div>
        ) : aiSuggestions.length ? (
          aiSuggestions.map((s, i) => (
            <div
              key={s.conversation_id ?? i}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-brand-100 hover:bg-brand-50/30 transition-colors cursor-pointer"
            >
              <div className="h-8 w-8 rounded-lg bg-brand-50 grid place-items-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-ink-900">{s.title}</span>
                </div>
                <p className="text-[11px] text-ink-600 mt-1 leading-snug">{s.message_count ? `${s.message_count} messages` : 'Open chat to start a conversation'}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-ink-600 py-6">No AI conversations yet. Open chat to ask the assistant.</div>
        )}
      </div>

      {/* CTA */}
      <Link
        to="/dashboard/chatbot"
        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-brand-200 text-brand-700 py-2.5 text-xs font-semibold hover:bg-brand-50 transition-colors"
      >
        <Bot size={14} />
        Ask AI a question
      </Link>
    </div>
  );
}
