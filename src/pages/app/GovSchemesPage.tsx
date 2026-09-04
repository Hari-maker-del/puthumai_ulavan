/**
 * GovSchemesPage.tsx  v2.0
 * Feature 5: AI Government Scheme Finder
 * Uses farmer memory to recommend relevant schemes via Gemini.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark, Search, Loader2, ExternalLink, ChevronDown, ChevronUp,
  FileText, CheckCircle2, AlertCircle, Brain, Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { getFarmerMemory, buildFarmerMemoryContext } from '@/services/farmerMemoryService';
import { askGemini } from '@/services/geminiService';
import { useI18n } from '@/i18n/I18nContext';
import { translateUiText } from '@/i18n/uiTranslations';
import { computeProfileCompleteness } from '@/services/farmerMemoryService';

interface Scheme {
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  documents: string;
  howToApply: string;
  link: string;
  state: string;
  category: string;
}

// Static well-known schemes as a fallback / base
const STATIC_SCHEMES: Scheme[] = [
  {
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    description: 'Direct income support of ₹6,000/year (in 3 instalments of ₹2,000) to landholding farmer families across India.',
    eligibility: 'All landholding farmers with valid land records. Excludes institutional landholders, salaried individuals, income-tax payers, and professionals.',
    benefits: '₹6,000 per year transferred directly to bank account.',
    documents: 'Aadhaar card, bank account details, land records (Patta/Chitta in Tamil Nadu).',
    howToApply: 'Apply at pmkisan.gov.in or through local Patwari / Village Revenue Officer.',
    link: 'https://pmkisan.gov.in',
    state: 'All India',
    category: 'Income Support',
  },
  {
    name: 'PMFBY – Pradhan Mantri Fasal Bima Yojana',
    description: 'Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pests, and diseases.',
    eligibility: 'All farmers growing notified crops in notified areas. Loanee farmers are enrolled compulsorily.',
    benefits: 'Insurance coverage up to full sum insured at low premium (2% for Kharif, 1.5% for Rabi, 5% for commercial crops).',
    documents: 'Aadhaar, bank account, land records, sowing certificate.',
    howToApply: 'Apply through nearest bank, Common Service Centre (CSC), or at pmfby.gov.in.',
    link: 'https://pmfby.gov.in',
    state: 'All India',
    category: 'Crop Insurance',
  },
  {
    name: 'Soil Health Card Scheme',
    description: 'Provides every farmer a Soil Health Card with crop-wise recommendations of nutrients and fertilisers for individual farms.',
    eligibility: 'All farmers in India.',
    benefits: 'Free soil testing, personalised fertiliser recommendation card valid for 3 years.',
    documents: 'Aadhaar card, land details.',
    howToApply: 'Contact local agriculture department or Krishi Vigyan Kendra (KVK). Apply at soilhealth.dac.gov.in.',
    link: 'https://soilhealth.dac.gov.in',
    state: 'All India',
    category: 'Soil Health',
  },
  {
    name: 'TNAU Crop Advisory – Tamil Nadu',
    description: 'Tamil Nadu Agricultural University (TNAU) provides free crop advisory, seed supply, and technology transfer to Tamil Nadu farmers.',
    eligibility: 'Farmers in Tamil Nadu.',
    benefits: 'Free agro-advisory, improved seed varieties, pest management guidance.',
    documents: 'Contact nearest TNAU centre or Agri extension office.',
    howToApply: 'Visit agritech.tnau.ac.in or contact District Agriculture Office.',
    link: 'https://agritech.tnau.ac.in',
    state: 'Tamil Nadu',
    category: 'Technical Support',
  },
  {
    name: 'eNAM – National Agriculture Market',
    description: 'Online trading platform for agricultural commodities connecting farmers, traders, and buyers across APMCs nationwide.',
    eligibility: 'All farmers and agri-traders.',
    benefits: 'Better market access, transparent price discovery, reduced post-harvest losses.',
    documents: 'Aadhaar, bank account for payment, commodity certificate.',
    howToApply: 'Register at enam.gov.in or contact nearest APMC/Mandi.',
    link: 'https://enam.gov.in',
    state: 'All India',
    category: 'Market Access',
  },
  {
    name: 'PM Kisan Maan Dhan Yojana – Farmers Pension',
    description: 'Voluntary pension scheme for small and marginal farmers providing ₹3,000/month after age 60.',
    eligibility: 'Small and marginal farmers aged 18–40 years with less than 2 hectares of cultivable land.',
    benefits: '₹3,000/month pension after 60 years of age.',
    documents: 'Aadhaar, bank account, land records.',
    howToApply: 'Enrol at nearest Common Service Centre (CSC) or maandhan.in.',
    link: 'https://maandhan.in',
    state: 'All India',
    category: 'Pension',
  },
];

interface ExpandedState {
  [key: string]: boolean;
}

interface AIRecommendation {
  schemeName: string;
  whyRelevant: string;
}

function parseRecommendations(raw: string): AIRecommendation[] {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    const items = Array.isArray(parsed) ? parsed : parsed.recommendations;
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && typeof item.schemeName === 'string' && typeof item.whyRelevant === 'string')
      .map((item) => ({ schemeName: item.schemeName.trim(), whyRelevant: item.whyRelevant.trim() }))
      .slice(0, 6);
  } catch {
    return [];
  }
}

function cleanAiText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getSafeAiError(): string {
  return 'AI recommendations are temporarily unavailable. Please try again in a few moments. Your farm data is safe.';
}

function findStaticScheme(name: string): Scheme | undefined {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return STATIC_SCHEMES.find((scheme) => {
    const candidate = scheme.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    return candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate);
  });
}

export default function GovSchemesPage() {
  const { user } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [schemes] = useState<Scheme[]>(STATIC_SCHEMES);
  const [aiSchemes, setAiSchemes] = useState<AIRecommendation[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [profileScore, setProfileScore] = useState(0);

  const profileComplete = profileScore === 100;
  const tr = (text: string) => translateUiText(text, language);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setProfileScore(0);
      return;
    }

    getFarmerMemory(user.id).then((mem) => {
      if (!active) return;
      const completeness = computeProfileCompleteness(mem);
      setProfileScore(completeness.score);
    }).catch(() => {
      if (!active) return;
      setProfileScore(0);
    });

    return () => { active = false; };
  }, [user?.id]);

  const fetchAIRecommendations = async () => {
    if (!user?.id || !profileComplete) {
      setAiError(null);
      return;
    }
    setLoadingAI(true);
    setAiError(null);
    setAiSchemes([]);
    try {
      const mem = await getFarmerMemory(user.id);
      const completeness = computeProfileCompleteness(mem);
      if (completeness.score < 100) {
        setProfileScore(completeness.score);
        throw new Error('PROFILE_INCOMPLETE');
      }
      const ctx = buildFarmerMemoryContext(mem);

      const schemeCatalog = STATIC_SCHEMES.map((scheme) => ({
        name: scheme.name,
        state: scheme.state,
        category: scheme.category,
        description: scheme.description,
      }));

      const prompt = `${ctx}

You are selecting recommendations from a VERIFIED catalog only. Do not create, rename, merge, or invent schemes.
Preferred response language: ${language}.

Verified scheme catalog:
${JSON.stringify(schemeCatalog)}

Select 4–6 schemes that are most relevant to this farmer based only on the supplied profile.
Consider crop, farm size, state/district, irrigation method, and other supplied profile details.
If the profile is incomplete, choose broadly relevant schemes and do not claim eligibility.

Return ONLY valid JSON in this exact shape:
{"recommendations":[{"schemeName":"exact catalog name","whyRelevant":"short reason in the preferred language"}]}

Rules:
- schemeName must exactly match a catalog name.
- Do not include benefits, eligibility, documents, deadlines, or URLs in whyRelevant.
- Do not claim the farmer is eligible.
- If a detail cannot be established from the profile, say it should be verified.
- No markdown, no code fences, no extra text.`;

      const result = await askGemini(prompt, ctx, language);
      const recommendations = parseRecommendations(result)
        .map((item) => ({ ...item, scheme: findStaticScheme(item.schemeName) }))
        .filter((item): item is AIRecommendation & { scheme: Scheme } => Boolean(item.scheme));

      if (!recommendations.length) {
        throw new Error('The AI could not return a valid scheme recommendation. Please try again.');
      }
      setAiSchemes(recommendations);
    } catch (err) {
      // Never expose provider/API errors, status codes, JSON, model names, or raw
      // exception messages to farmers. Keep technical details in development logs.
      if (import.meta.env.DEV) console.error('Government scheme recommendation error:', err);
      setAiError(getSafeAiError());
    } finally {
      setLoadingAI(false);
    }
  };

  const toggle = (name: string) => setExpanded((e) => ({ ...e, [name]: !e[name] }));

  const categories = ['All', ...Array.from(new Set(schemes.map((s) => s.category)))];

  const filtered = schemes.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    const matchesCat = filter === 'All' || s.category === filter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={Landmark} title={tr('Government Schemes')}
        subtitle={tr('Find Central and Tamil Nadu state schemes relevant to your farm.')} />

      {/* AI Recommendations panel */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-600" />
            <span className="font-display font-bold text-ink-900">{tr('AI Scheme Recommendations')}</span>
          </div>
          <button
            onClick={fetchAIRecommendations}
            disabled={loadingAI || !profileComplete}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 transition-colors shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingAI ? <><Loader2 size={14} className="animate-spin" /> Finding schemes…</> : <><Brain size={14} /> Get AI Recommendations</>}
          </button>
        </div>

        {!profileComplete && (
          <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={17} className="mt-0.5 flex-shrink-0 text-amber-700" />
              <div className="flex-1">
                <p className="text-sm font-bold text-ink-900">Complete your Farm Memory profile first</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">Add your farmer name, location, farm size, soil, irrigation, crop, crop stage, previous crop and farm category. AI recommendations will only be called after the profile is complete.</p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-amber-800">Profile completeness: {profileScore}%</span>
                  <button onClick={() => navigate('/app/farmer-memory')} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700">Complete Farm Memory</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiSchemes.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="text-xs font-bold text-brand-700 flex items-center gap-1">
              <Brain size={12} /> {tr('Personalised recommendations based on your farm profile')}
            </div>
            {aiSchemes.map((recommendation) => {
              const scheme = recommendation.scheme;
              return (
                <div key={scheme.name} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-ink-900">{scheme.name}</h3>
                      <span className="mt-1 inline-block text-[10px] font-bold bg-white text-brand-700 rounded-lg px-2 py-0.5">{scheme.category}</span>
                    </div>
                    <span className="text-[10px] text-ink-500 bg-white rounded-lg px-2 py-0.5">{scheme.state}</span>
                  </div>
                  <div className="mt-3 rounded-xl bg-white border border-brand-100 p-3">
                    <div className="text-xs font-bold text-brand-700 mb-1">{tr('Why this may be relevant')}</div>
                    <p className="text-sm text-ink-700 leading-relaxed">{cleanAiText(recommendation.whyRelevant)}</p>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white border border-gray-100 p-3">
                      <div className="text-xs font-bold text-ink-700 mb-1">{tr('Key benefit')}</div>
                      <p className="text-xs text-ink-600">{scheme.benefits}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-3">
                      <div className="text-xs font-bold text-ink-700 mb-1">{tr('How to apply')}</div>
                      <p className="text-xs text-ink-600">{scheme.howToApply}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> Verify current eligibility, documents and deadlines on the official government portal before applying.
                  </div>
                  <a href={scheme.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
                    <ExternalLink size={12} /> Official portal
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('Search schemes…')}
            className="w-full rounded-xl bg-white border border-gray-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                filter === cat ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-ink-700 hover:border-brand-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-ink-500 text-sm">{tr('No schemes match your search.')}</div>
        )}
        {filtered.map((scheme) => (
          <GlassCard key={scheme.name} padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-ink-900">{scheme.name}</h3>
                  <span className="text-[10px] font-bold bg-brand-50 text-brand-700 rounded-lg px-2 py-0.5">{scheme.category}</span>
                  <span className="text-[10px] text-ink-500 bg-gray-50 rounded-lg px-2 py-0.5">{scheme.state}</span>
                </div>
                <p className="text-sm text-ink-600 mt-1">{scheme.description}</p>
              </div>
              <button onClick={() => toggle(scheme.name)}
                className="flex-shrink-0 h-8 w-8 rounded-xl bg-brand-50 grid place-items-center hover:bg-brand-100 transition-colors">
                {expanded[scheme.name] ? <ChevronUp size={16} className="text-brand-600" /> : <ChevronDown size={16} className="text-brand-600" />}
              </button>
            </div>

            {expanded[scheme.name] && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-brand-50 border border-brand-100 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 mb-1">
                      <CheckCircle2 size={12} /> {tr('Eligibility')}
                    </div>
                    <p className="text-xs text-ink-700">{scheme.eligibility}</p>
                  </div>
                  <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 mb-1">
                      <Sparkles size={12} /> {tr('Benefits')}
                    </div>
                    <p className="text-xs text-ink-700">{scheme.benefits}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                      <FileText size={12} /> {tr('Required Documents')}
                    </div>
                    <p className="text-xs text-ink-700">{scheme.documents}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <div className="text-xs font-bold text-ink-700 mb-1">{tr('How to Apply')}</div>
                    <p className="text-xs text-ink-600">{scheme.howToApply}</p>
                  </div>
                </div>
                {scheme.link && scheme.link !== '#' && (
                  <a href={scheme.link} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
                    <ExternalLink size={12} /> {tr('Official Portal')}: {scheme.link}
                  </a>
                )}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      <div className="text-[11px] text-ink-400 text-center pb-2">
        {tr('Scheme details are for informational purposes. Always verify current eligibility and deadlines at official portals.')}
      </div>
    </div>
  );
}
