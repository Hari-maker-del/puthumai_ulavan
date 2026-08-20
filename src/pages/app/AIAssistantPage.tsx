/** Farm-aware Uzhavan AI copilot. Existing UI preserved; data and chat history are now live-aware. */

interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, Mic, MicOff, ImagePlus, Plus, MessageSquare,
  AlertCircle, Wifi, Volume2, VolumeX, Globe, Brain, Trash2, RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';

type ChatMessage = { id: string; role: 'user' | 'assistant' | 'system' | 'error'; text: string; time: string };
import { createGeminiSession, type GeminiSession } from '@/services/geminiService';
import { useAuth } from '@/context/AuthContext';
import { buildCopilotContext, type CopilotContext } from '@/services/aiCopilotService';
import {
  deleteConversation, getConversation, getConversationSummaries, saveConversationMessage,
  type AIConversationSummary,
} from '@/services/aiConversationService';

const LANGUAGE_OPTIONS = [
  { code: 'ta-IN', label: 'Tamil', prompt: 'ta' },
  { code: 'en-IN', label: 'English', prompt: 'en' },
  { code: 'hi-IN', label: 'Hindi', prompt: 'hi' },
  { code: 'te-IN', label: 'Telugu', prompt: 'te' },
  { code: 'ml-IN', label: 'Malayalam', prompt: 'ml' },
  { code: 'kn-IN', label: 'Kannada', prompt: 'kn' },
];

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

export default function AIAssistantPage() {
  const { profile, user } = useAuth();
  const [copilotContext, setCopilotContext] = useState<CopilotContext | null>(null);
  const contextRef = useRef<CopilotContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const [selectedLang, setSelectedLang] = useState(() => {
    const saved = profile?.preferred_language ?? 'en';
    return LANGUAGE_OPTIONS.find((l) => l.prompt === saved) ?? LANGUAGE_OPTIONS[0];
  });
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const apiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;
  const memory = copilotContext?.farmerMemory ?? null;
  const hasMemory = !!memory && !!(memory.current_crop || memory.district || memory.farmer_name);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { sessionRef.current = null; }, [selectedLang]);
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
      const message = error instanceof Error ? error.message : 'Farm context is unavailable right now.';
      setContextError(message);
      return contextRef.current;
    } finally {
      setContextLoading(false);
    }
  }, [user?.id]);

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
      setContextError(error instanceof Error ? error.message : 'Unable to load this conversation.');
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

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
      utter.lang = selectedLang.code;
      utter.rate = 0.9;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  }, [ttsEnabled, ttsSupported, selectedLang.code]);

  const toggleVoice = useCallback(() => {
    try {
      const SR = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
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
      rec.lang = selectedLang.code;
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        if (transcript) setInput(transcript);
        setVoiceState('idle');
      };
      rec.onerror = (event: { error?: string }) => {
        const errors: Record<string, string> = {
          'not-allowed': 'Microphone permission denied.',
          'no-speech': 'No speech detected. Please speak clearly.',
          network: 'Network error during voice recognition.',
        };
        setVoiceError(errors[event.error] ?? `Voice error: ${event.error}`);
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
  }, [selectedLang.code, voiceState]);

  const getSession = useCallback((context: CopilotContext | null) => {
    if (!sessionRef.current) {
      sessionRef.current = createGeminiSession(messagesRef.current, context?.assembled ?? '', selectedLang.prompt);
    }
    return sessionRef.current;
  }, [selectedLang.prompt]);

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
      const errText = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      const errorMsg: ChatMessage = { id: uid('e'), role: 'assistant', text: `⚠️ ${errText}`, time: now() };
      setMessages((current) => [...current, errorMsg]);
      messagesRef.current = [...messagesRef.current, errorMsg];
    } finally {
      setProcessing(false);
    }
  }, [activeConversationId, getSession, processing, refreshContext, speak, user?.id]);

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
  const statusText = voiceState === 'listening' ? '🎙️ Listening' : processing ? '🧠 Processing' : speaking ? '🔊 Speaking' : 'Online';

  return (
    <div className="space-y-6">
      <PageHeader icon={Bot} title="AI Farming Assistant" subtitle="Farm-aware AI copilot — uses your farm profile, crop, weather, alerts and farm records." />

      {apiKeyMissing && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div><span className="text-xs font-bold text-amber-700">Gemini API Key Not Configured</span><p className="text-xs text-amber-700 mt-0.5">Add <code className="font-mono bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY</code> to enable AI answers.</p></div>
        </div>
      )}
      {contextError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><AlertCircle size={15} />{contextError}</div>}
      {!hasMemory && !apiKeyMissing && <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3"><Brain size={16} className="text-brand-600 flex-shrink-0 mt-0.5" /><div className="text-xs text-brand-700"><span className="font-bold">Tip:</span> Complete your <Link to="/app/farmer-memory" className="underline font-semibold">Farm Memory profile</Link> for personalised advice.</div></div>}
      {voiceError && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"><MicOff size={16} className="text-red-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-red-700">{voiceError}</p><button className="ml-auto text-xs font-semibold underline" onClick={() => { setVoiceError(null); setVoiceState('idle'); }}>Dismiss</button></div>}

      <div className="grid lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <GlassCard padding="md">
            <button onClick={newChat} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-brand-700 transition-colors shadow-card"><Plus size={16} /> New Chat</button>
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink-600 mb-1.5 flex items-center gap-1"><Globe size={11} /> Language</div>
              <select className="w-full rounded-xl bg-brand-50 border border-gray-100 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-400" value={selectedLang.code} onChange={(e) => { const l = LANGUAGE_OPTIONS.find((o) => o.code === e.target.value) ?? LANGUAGE_OPTIONS[0]; setSelectedLang(l); }}>
                {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            {ttsSupported && <button onClick={() => setTtsEnabled((v) => !v)} className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors border ${ttsEnabled ? 'bg-brand-600 text-white border-brand-600' : 'bg-brand-50 text-ink-700 border-gray-100 hover:border-brand-200'}`}>{ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}{ttsEnabled ? 'Read Aloud: On' : 'Read Aloud: Off'}</button>}
            {hasMemory && <div className="mt-3 rounded-xl bg-brand-50 border border-brand-100 p-2.5"><div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700"><Brain size={11} /> Farm context active</div>{memory?.current_crop && <div className="text-[10px] text-ink-600 mt-0.5">Crop: {memory.current_crop}</div>}{memory?.district && <div className="text-[10px] text-ink-600">Location: {memory.district}</div>}{contextLoading && <div className="text-[10px] text-brand-600 mt-1 flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Refreshing live context</div>}</div>}

            <div className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink-600 mb-2">Previous Chats</div>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto scrollbar-none">
              {historyLoading && <div className="text-[11px] text-ink-500 px-2 py-2">Loading history…</div>}
              {!historyLoading && conversations.length === 0 && <div className="text-[11px] text-ink-500 px-2 py-2">No saved conversations yet.</div>}
              {conversations.map((ch) => (
                <div key={ch.conversation_id} className={`group rounded-xl px-2 py-1 ${ch.conversation_id === activeConversationId ? 'bg-brand-50 border border-brand-100' : 'hover:bg-brand-50'}`}>
                  <div className="flex items-center gap-1"><button onClick={() => loadConversation(ch.conversation_id)} className="flex-1 min-w-0 text-left rounded-lg px-1 py-1.5"><div className="flex items-center gap-2"><MessageSquare size={14} className={ch.conversation_id === activeConversationId ? 'text-brand-600' : 'text-ink-600/60'} /><span className="text-xs font-semibold truncate text-ink-800">{ch.title}</span></div><div className="text-[10px] text-ink-600/60 mt-0.5 pl-5">{new Date(ch.updated_at).toLocaleDateString('en-IN')}</div></button><button onClick={() => deleteActive(ch.conversation_id)} className="p-1.5 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50" aria-label={`Delete ${ch.title}`}><Trash2 size={13} /></button></div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard padding="md" className="lg:col-span-2 flex flex-col h-[600px]">
          <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="h-10 w-10 rounded-2xl bg-brand-600 grid place-items-center shadow-card"><Bot size={20} className="text-white" /></div>
            <div className="flex-1 min-w-0"><div className="font-display font-bold text-ink-900">Uzhavan AI</div><div className="text-[11px] text-brand-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{apiKeyMissing ? <span className="text-amber-600 flex items-center gap-1"><Wifi size={10} /> API key required</span> : <span>{statusText} · {hasMemory ? 'Farm-aware · Gemini AI' : 'Gemini AI'}</span>}</div></div>
            <div className="text-[10px] font-semibold text-ink-500 bg-gray-50 rounded-lg px-2 py-1">{selectedLang.label}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
            {messages.length === 0 && <div className="h-full grid place-items-center text-center py-10"><div><div className="mx-auto h-16 w-16 rounded-xl bg-brand-100 grid place-items-center mb-3"><Bot size={30} className="text-brand-600" /></div><div className="font-display font-bold text-ink-900">Start a conversation</div><div className="text-sm text-ink-600 mt-1">Ask me anything about your farm</div>{hasMemory && <div className="mt-2 text-xs text-brand-600 flex items-center justify-center gap-1"><Brain size={11} /> I know your farm profile — ask something specific!</div>}</div></div>}
            {messages.map((m) => <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>{m.role === 'assistant' && <div className="h-7 w-7 rounded-full bg-brand-600 grid place-items-center mr-2 mt-1 flex-shrink-0"><Bot size={14} className="text-white" /></div>}<div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand-600 text-white rounded-br-md' : m.text.startsWith('⚠️') ? 'bg-red-50 border border-red-100 text-red-800 rounded-bl-md' : 'bg-brand-50 border border-gray-100 text-ink-900 rounded-bl-md'}`}>{m.text.split('\n').map((line, li) => line === '' ? <br key={li} /> : <p key={li} className={li > 0 ? 'mt-1' : ''}>{line}</p>)}<div className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-brand-100' : 'text-ink-600'}`}>{m.time}</div></div></motion.div>)}
            <AnimatePresence>{processing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start"><div className="h-7 w-7 rounded-full bg-brand-600 grid place-items-center mr-2 mt-1 flex-shrink-0"><Bot size={14} className="text-white" /></div><div className="bg-brand-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center"><span className="text-[11px] text-ink-600 mr-1">🧠 Processing</span>{[0, 1, 2].map((i) => <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} className="h-1.5 w-1.5 rounded-full bg-brand-400 inline-block" />)}</div></motion.div>}</AnimatePresence>
            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="mt-2 p-2 border-t border-gray-100 flex-shrink-0"><div className="flex items-center gap-2">
            <button type="button" className={`grid place-items-center h-11 w-11 rounded-2xl border transition-colors flex-shrink-0 ${voiceState === 'listening' ? 'bg-error-500/10 border-error-500/20 text-error-600' : voiceState === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-brand-50 border-gray-100 text-ink-800/55 hover:text-brand-700'}`} onClick={toggleVoice} aria-label={voiceState === 'listening' ? 'Stop listening' : 'Voice input'}>{voiceState === 'listening' ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}</button>
            <button type="button" className="grid place-items-center h-11 w-11 rounded-2xl bg-brand-50 border border-gray-100 text-ink-800/55 hover:text-brand-700 transition-colors flex-shrink-0" aria-label="Upload image"><ImagePlus size={18} /></button>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={voiceState === 'listening' ? `🎙️ Listening in ${selectedLang.label}…` : hasMemory ? `Ask about your ${memory?.current_crop ?? 'farm'}…` : 'Ask Uzhavan AI anything…'} disabled={processing} className="flex-1 rounded-2xl bg-brand-50 border border-gray-100 px-4 py-3 text-sm outline-none placeholder:text-ink-600/60 focus:ring-2 focus:ring-brand-400 focus:border-transparent transition disabled:opacity-60" />
            <button type="submit" disabled={processing || !input.trim()} className="grid place-items-center h-11 w-11 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 transition-colors flex-shrink-0 shadow-card disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send"><Send size={18} /></button>
          </div></form>
        </GlassCard>

        <div className="lg:col-span-1 space-y-4">
          <GlassCard padding="lg">
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-brand-600" /><div className="font-display font-bold text-ink-900">Suggested Questions</div></div>
            <div className="mt-4 space-y-2">{[...(hasMemory && memory?.current_crop ? [`What fertiliser is suitable for my ${memory.current_crop}?`, `What crop health checks should I do for ${memory.current_crop}?`] : []), 'How do I improve soil health?', 'How to reduce input costs?', 'What crop gives better returns?'].slice(0, 5).map((q) => <button key={q} onClick={() => send(q)} disabled={processing} className="w-full text-left rounded-2xl bg-brand-50 border border-gray-100 p-3 text-sm font-medium text-ink-800/70 hover:border-brand-200 hover:text-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{q}</button>)}</div>
          </GlassCard>
          <GlassCard padding="lg">
            <div className="font-display font-bold text-ink-900 text-sm mb-3">Today's Actions</div>
            <div className="space-y-3">
              {conversations.length === 0 ? <div className="text-xs text-ink-600">No suggested actions available yet.</div> : conversations.slice(0, 5).map((c) => (
                <button key={c.conversation_id} onClick={() => loadConversation(c.conversation_id)} disabled={processing} className="w-full text-left rounded-2xl bg-brand-50 border border-gray-100 p-3 hover:border-brand-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-brand-100 grid place-items-center flex-shrink-0"><Bot size={15} className="text-brand-700" /></div><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700">Chat</span></div>
                  <div className="mt-2 text-sm font-bold text-ink-900">{c.title}</div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
