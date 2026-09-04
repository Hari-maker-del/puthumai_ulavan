/** Farm-aware Uzhavan AI copilot. Existing UI preserved; data and chat history are now live-aware. */
import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, Mic, MicOff, ImagePlus, Plus, MessageSquare,
  AlertCircle, Volume2, VolumeX, Globe, Brain, Trash2, RefreshCw,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { ChatMessage } from '@/services/types';
import { useI18n } from '@/i18n/I18nContext';
import { getAiCopy } from '@/i18n/aiTranslations';
import { getLanguage } from '@/i18n/languages';
import { createGeminiSession, type GeminiSession } from '@/services/geminiService';
import { useAuth } from '@/context/AuthContext';
import { buildCopilotContext, type CopilotContext } from '@/services/aiCopilotService';
import {
  deleteConversation, getConversation, getConversationSummaries, saveConversationMessage,
  type AIConversationSummary,
} from '@/services/aiConversationService';



function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function uid(prefix: string) {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function conversationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function toChatMessages(rows: Awaited<ReturnType<typeof getConversation>>): ChatMessage[] {
  return rows.map((row) => ({ id: row.id, role: row.role, text: row.message, time: new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) }));
}

function farmerSafeError(error: unknown, copy: ReturnType<typeof getAiCopy>): string {
  return `${copy.temporarilyUnavailable}\n\n${copy.unavailableDesc}`;
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [copilotContext, setCopilotContext] = useState<CopilotContext | null>(null);
  const contextRef = useRef<CopilotContext | null>(null);
  const [, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const { language } = useI18n();
  const selectedLang = getLanguage(language);
  const copy = getAiCopy(language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const sessionRef = useRef<GeminiSession | null>(null);

  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => conversationId());
  const [historyLoading, setHistoryLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Gemini credentials stay server-side; availability is reported by the API response.
  const apiKeyMissing = false;
  const memory = copilotContext?.farmerMemory ?? null;
  const hasMemory = !!memory && !!(memory.current_crop || memory.district || memory.farmer_name);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { sessionRef.current = null; }, [language]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, processing]);

  const refreshContext = useCallback(async () => {
    if (!user?.id) return null;
    setContextLoading(true);
    setContextError(null);
    try {
      const next = await buildCopilotContext(user.id);
      contextRef.current = next;
      setCopilotContext(next);
      sessionRef.current = null;
      return next;
    } catch (error) {
      setContextError(farmerSafeError(error, copy));
      return contextRef.current;
    } finally {
      setContextLoading(false);
    }
  }, [user?.id, copy]);

  useEffect(() => {
    if (!user?.id) return;
    refreshContext();
    setHistoryLoading(true);
    getConversationSummaries(user.id)
      .then((rows) => setConversations(rows))
      .catch(() => setConversations([]))
      .finally(() => setHistoryLoading(false));
  }, [user?.id, refreshContext]);

  const loadConversation = useCallback(async (id: string) => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const rows = await getConversation(user.id, id);
      const loaded = toChatMessages(rows);
      setMessages(loaded);
      messagesRef.current = loaded;
      setActiveConversationId(id);
      sessionRef.current = null;
    } catch (error) {
      setContextError(farmerSafeError(error, copy));
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id, copy]);

  const newChat = useCallback(() => {
    setActiveConversationId(conversationId());
    setMessages([]);
    messagesRef.current = [];
    setInput('');
    setProcessing(false);
    sessionRef.current = null;
    try { window.speechSynthesis?.cancel(); } catch { /* speech failure must never break the page */ }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
      utter.lang = selectedLang.locale;
      utter.rate = 0.9;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  }, [ttsEnabled, ttsSupported, selectedLang.locale]);

  const toggleVoice = useCallback(() => {
    try {
      type SpeechRecognitionCtor = new () => SpeechRecognition;
      const w = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!SR) {
        setVoiceError('Voice input is not supported in this browser. Try Chrome on Android or desktop.');
        setVoiceState('error');
        return;
      }
      setVoiceError(null);
      if (voiceState === 'listening') {
        recognitionRef.current?.stop();
        setVoiceState('idle');
        return;
      }
      const rec = new SR();
      rec.lang = selectedLang.locale;
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        if (transcript) setInput(transcript);
        setVoiceState('idle');
      };
      rec.onerror = (event: SpeechRecognitionEvent) => {
        const errors: Record<string, string> = {
          'not-allowed': 'Microphone permission denied.',
          'no-speech': 'No speech detected. Please speak clearly.',
          network: 'Network error during voice recognition.',
        };
        const err = (event as SpeechRecognitionErrorEvent).error ?? 'unknown';
        setVoiceError(errors[err] ?? `Voice error: ${err}`);
        setVoiceState('error');
      };
      rec.onend = () => setVoiceState((state) => state === 'error' ? state : 'idle');
      recognitionRef.current = rec;
      rec.start();
      setVoiceState('listening');
    } catch {
      setVoiceError('Could not start voice recognition.');
      setVoiceState('error');
    }
  }, [selectedLang.locale, voiceState]);

  const getSession = useCallback((context: CopilotContext | null) => {
    if (!sessionRef.current) {
      sessionRef.current = createGeminiSession(messagesRef.current, context?.assembled ?? '', language);
    }
    return sessionRef.current;
  }, [language]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || processing) return;
    const userMsg: ChatMessage = { id: uid('u'), role: 'user', text: trimmed, time: now() };
    setMessages((current) => [...current, userMsg]);
    messagesRef.current = [...messagesRef.current, userMsg];
    setInput('');
    setProcessing(true);
    try {
      const liveContext = await refreshContext();
      if (!liveContext) throw new Error('Farm context is unavailable. Please try again.');
      const replyText = await getSession(liveContext).sendMessage(trimmed);
      const assistantMsg: ChatMessage = { id: uid('a'), role: 'assistant', text: replyText, time: now() };
      setMessages((current) => [...current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];
      if (user?.id) {
        const snapshot = {
          farmer: liveContext.farmerMemory?.farmer_name ?? null,
          crop: liveContext.farmerMemory?.current_crop ?? null,
          district: liveContext.farmerMemory?.district ?? null,
          weatherAvailable: liveContext.weatherAvailable,
          marketAvailable: liveContext.marketAvailable,
          yieldAvailable: liveContext.yieldAvailable,
        };
        await Promise.allSettled([
          saveConversationMessage(user.id, activeConversationId, 'user', trimmed, snapshot),
          saveConversationMessage(user.id, activeConversationId, 'assistant', replyText, snapshot),
        ]);
        setConversations((current) => {
          const existing = current.find((c) => c.conversation_id === activeConversationId);
          const next: AIConversationSummary = {
            conversation_id: activeConversationId,
            title: existing?.title ?? trimmed.slice(0, 60),
            created_at: existing?.created_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: (existing?.message_count ?? 0) + 2,
          };
          return [next, ...current.filter((c) => c.conversation_id !== activeConversationId)];
        });
      }
      speak(replyText);
    } catch (error) {
      const errText = farmerSafeError(error, copy);
      const errorMsg: ChatMessage = { id: uid('e'), role: 'assistant', text: errText, time: now() };
      setMessages((current) => [...current, errorMsg]);
      messagesRef.current = [...messagesRef.current, errorMsg];
    } finally {
      setProcessing(false);
    }
  }, [activeConversationId, copy, getSession, processing, refreshContext, speak, user?.id]);

  const deleteActive = useCallback(async (id: string) => {
    if (!user?.id) return;
    try {
      await deleteConversation(user.id, id);
      setConversations((current) => current.filter((c) => c.conversation_id !== id));
      if (id === activeConversationId) newChat();
    } catch (error) {
      setContextError(error instanceof Error ? error.message : 'Unable to delete conversation.');
    }
  }, [activeConversationId, newChat, user?.id]);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };
  const statusText = voiceState === 'listening' ? copy.listening : processing ? copy.processing : speaking ? '🔊 Speaking' : copy.online;
  const questionCopies = [
    { icon: '🌱', text: copy.cropAdvice, prompt: 'Give me practical crop advice for my farm.' },
    { icon: '💧', text: copy.irrigation, prompt: 'When should I irrigate my crop?' },
    { icon: '🐛', text: copy.pest, prompt: 'How can I identify and manage crop pests or disease?' },
    { icon: '🌦️', text: copy.weather, prompt: 'How should today’s weather affect my farm work?' },
    { icon: '💰', text: copy.market, prompt: 'What should I consider about the market for my crop?' },
  ];

  return (
    <div className="space-y-5">
      <div className="w-full min-w-0 rounded-3xl bg-white border border-gray-100 shadow-card overflow-hidden">
        <div className="flex min-w-0 items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
          <div className="h-12 w-12 rounded-2xl bg-brand-600 grid place-items-center shadow-card"><Bot size={23} className="text-white" /></div>
          <div className="min-w-0 flex-1">
            <div className="font-display font-extrabold text-xl text-ink-900">{copy.assistant}</div>
            <div className="text-xs text-brand-600 flex items-center gap-1.5 mt-0.5"><span className="h-2 w-2 rounded-full bg-brand-500" />{apiKeyMissing ? copy.temporarilyUnavailable : statusText}</div>
          </div>
          <div className="max-w-[96px] shrink-0 truncate rounded-xl bg-brand-50 border border-brand-100 px-3 py-2 text-xs font-bold text-brand-700 sm:max-w-none">{selectedLang.nativeName}</div>
        </div>
        <div className="min-w-0 px-4 sm:px-5 py-4 bg-brand-50/40">
          <p className="text-sm text-ink-600 max-w-3xl">{copy.subtitle}</p>
          {hasMemory && <div className="mt-2 text-xs text-brand-700 flex items-center gap-1"><Brain size={12} /> {copy.farmAware}{memory?.current_crop ? ` · ${memory.current_crop}` : ''}</div>}
        </div>
      </div>

      {contextError && <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><AlertCircle size={15} />{copy.unavailableDesc}</div>}
      {voiceError && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"><MicOff size={16} className="text-red-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-red-700">{voiceError}</p><button className="ml-auto text-xs font-semibold underline" onClick={() => { setVoiceError(null); setVoiceState('idle'); }}>Dismiss</button></div>}
      {!hasMemory && !apiKeyMissing && <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3"><Brain size={16} className="text-brand-600 flex-shrink-0 mt-0.5" /><div className="text-xs text-brand-700">{copy.profileTip}</div></div>}

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_250px] gap-4 sm:gap-5">
        <aside className="space-y-4">
          <GlassCard padding="md">
            <button onClick={newChat} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-4 py-3 text-sm font-bold hover:bg-brand-700 transition-colors shadow-card"><Plus size={16} /> {copy.newChat}</button>
            <div className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 flex items-center gap-2"><Globe size={13} /> {copy.language}: {selectedLang.nativeName}</div>
            {ttsSupported && <button onClick={() => setTtsEnabled((v) => !v)} className={`mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors border ${ttsEnabled ? 'bg-brand-600 text-white border-brand-600' : 'bg-brand-50 text-ink-700 border-gray-100 hover:border-brand-200'}`}>{ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}{ttsEnabled ? copy.readAloudOn : copy.readAloudOff}</button>}
            <div className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink-600 mb-2">{copy.previousChats}</div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-none">
              {historyLoading && <div className="text-[11px] text-ink-500 px-2 py-2">{copy.processing}…</div>}
              {!historyLoading && conversations.length === 0 && <div className="text-[11px] text-ink-500 px-2 py-2">{copy.noChats}</div>}
              {conversations.map((ch) => <div key={ch.conversation_id} className={`group rounded-xl px-2 py-1 ${ch.conversation_id === activeConversationId ? 'bg-brand-50 border border-brand-100' : 'hover:bg-brand-50'}`}><div className="flex items-center gap-1"><button onClick={() => loadConversation(ch.conversation_id)} className="flex-1 min-w-0 text-left rounded-lg px-1 py-1.5"><div className="flex items-center gap-2"><MessageSquare size={14} className={ch.conversation_id === activeConversationId ? 'text-brand-600' : 'text-ink-600/60'} /><span className="text-xs font-semibold truncate text-ink-800">{ch.title}</span></div><div className="text-[10px] text-ink-600/60 mt-0.5 pl-5">{new Date(ch.updated_at).toLocaleDateString('en-IN')}</div></button><button onClick={() => deleteActive(ch.conversation_id)} className="p-1.5 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50" aria-label={`Delete ${ch.title}`}><Trash2 size={13} /></button></div></div>)}
            </div>
          </GlassCard>
        </aside>

        <GlassCard padding="md" className="flex min-w-0 max-w-full flex-col min-h-[500px] sm:min-h-[600px] lg:order-none order-first">
          <div className="flex-1 min-h-[360px] overflow-y-auto p-2 sm:p-3 space-y-3 scrollbar-none">
            {messages.length === 0 && <div className="h-full min-h-[420px] grid place-items-center text-center py-10"><div><div className="mx-auto h-20 w-20 rounded-3xl bg-brand-100 grid place-items-center mb-4"><Bot size={38} className="text-brand-600" /></div><div className="font-display font-extrabold text-xl text-ink-900">{copy.start}</div><div className="text-sm text-ink-600 mt-1">{copy.askAnything}</div></div></div>}
            {messages.map((m) => <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>{m.role === 'assistant' && <div className="h-7 w-7 rounded-full bg-brand-600 grid place-items-center mr-2 mt-1 flex-shrink-0"><Bot size={14} className="text-white" /></div>}<div className={`max-w-[92%] sm:max-w-[85%] break-words rounded-2xl px-3 sm:px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand-600 text-white rounded-br-md' : m.text.includes(copy.temporarilyUnavailable) ? 'bg-amber-50 border border-amber-100 text-amber-900 rounded-bl-md' : 'bg-brand-50 border border-gray-100 text-ink-900 rounded-bl-md'}`}>{m.text.split('\n').map((line, li) => line === '' ? <br key={li} /> : <p key={li} className={li > 0 ? 'mt-1' : ''}>{line}</p>)}<div className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-brand-100' : 'text-ink-600'}`}>{m.time}</div></div></motion.div>)}
            <AnimatePresence>{processing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start"><div className="h-7 w-7 rounded-full bg-brand-600 grid place-items-center mr-2 mt-1 flex-shrink-0"><Bot size={14} className="text-white" /></div><div className="bg-brand-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center"><span className="text-[11px] text-ink-600 mr-1">{copy.processing}</span>{[0,1,2].map((i)=><motion.span key={i} animate={{y:[0,-4,0]}} transition={{duration:.8,repeat:Infinity,delay:i*.15}} className="h-1.5 w-1.5 rounded-full bg-brand-400 inline-block" />)}</div></motion.div>}</AnimatePresence>
            <div ref={endRef} />
          </div>
          <form onSubmit={onSubmit} className="mt-2 p-2 border-t border-gray-100 flex-shrink-0"><div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" className={`grid place-items-center h-11 w-11 rounded-2xl border transition-colors flex-shrink-0 ${voiceState === 'listening' ? 'bg-error-500/10 border-error-500/20 text-error-600' : voiceState === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-brand-50 border-gray-100 text-ink-800/55 hover:text-brand-700'}`} onClick={toggleVoice} aria-label={voiceState === 'listening' ? 'Stop listening' : 'Voice input'}>{voiceState === 'listening' ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}</button>
            <button type="button" className="grid place-items-center h-11 w-11 rounded-2xl bg-brand-50 border border-gray-100 text-ink-800/55 hover:text-brand-700 transition-colors flex-shrink-0" aria-label="Upload image"><ImagePlus size={18} /></button>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={voiceState === 'listening' ? `🎙️ ${copy.listening} · ${selectedLang.nativeName}` : hasMemory ? `${copy.askAnything} · ${memory?.current_crop ?? ''}` : copy.askPlaceholder} disabled={processing} className="flex-1 min-w-0 rounded-2xl bg-brand-50 border border-gray-100 px-3 sm:px-4 py-3 text-sm outline-none placeholder:text-ink-600/60 focus:ring-2 focus:ring-brand-400 focus:border-transparent transition disabled:opacity-60" />
            <button type="submit" disabled={processing || !input.trim()} className="grid place-items-center h-11 w-11 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 transition-colors flex-shrink-0 shadow-card disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send"><Send size={18} /></button>
          </div></form>
        </GlassCard>

        <aside className="space-y-4">
          <GlassCard padding="lg"><div className="flex items-center gap-2"><Sparkles size={18} className="text-brand-600" /><div className="font-display font-bold text-ink-900">{copy.suggested}</div></div><div className="mt-4 space-y-2">{questionCopies.map((q) => <button key={q.text} onClick={() => send(q.prompt)} disabled={processing} className="w-full text-left rounded-2xl bg-brand-50 border border-gray-100 p-3 text-sm font-medium text-ink-800/75 hover:border-brand-200 hover:text-brand-700 transition-colors disabled:opacity-50"><span className="mr-2">{q.icon}</span>{q.text}</button>)}</div></GlassCard>
          <GlassCard padding="lg"><div className="font-display font-bold text-ink-900 text-sm mb-2">{copy.farmDataSafe}</div><div className="text-xs text-ink-600 leading-5">{copy.unavailableDesc}</div><button onClick={() => send('Please give me a practical farming plan for today.')} disabled={processing} className="mt-3 w-full rounded-xl bg-brand-600 text-white px-3 py-2.5 text-xs font-bold hover:bg-brand-700 disabled:opacity-50"><RefreshCw size={13} className="inline mr-1.5" />{copy.tryAgain}</button></GlassCard>
        </aside>
      </div>
    </div>
  );
}
