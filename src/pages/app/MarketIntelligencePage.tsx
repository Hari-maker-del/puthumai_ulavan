import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, BarChart3, Calculator, CheckCircle2,
  ChevronDown, Info, Lightbulb, MapPin, RefreshCw, ShieldCheck, TrendingDown,
  TrendingUp, Wheat,
} from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { getFarmerMemory, type FarmerMemory } from '@/services/farmerMemoryService';
import {
  getMarketIntelligence,
  type MarketPrice,
  type MarketDataSource,
} from '@/services/marketIntelligenceService';

const CROPS = [
  'Paddy', 'Tomato', 'Sugarcane', 'Banana', 'Groundnut', 'Maize', 'Cotton',
  'Black gram', 'Wheat', 'Onion', 'Turmeric', 'Chilli',
];

function fmt(value: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(value?: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function percentChange(first: number, last: number) {
  return first === 0 ? 0 : ((last - first) / first) * 100;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 640;
  const height = 150;
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - 12 - ((value - min) / range) * (height - 24),
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" preserveAspectRatio="none" aria-label="7-day market price trend">
      <defs>
        <linearGradient id="marketTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#marketTrendFill)" />
      <path d={path} fill="none" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={index === 0 || index === points.length - 1 ? 5 : 0} fill="#2E7D32" />
      ))}
    </svg>
  );
}

function DataSourceBadge({ source, label }: { source: MarketDataSource; label: string }) {
  if (source === 'government') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-success-700"><CheckCircle2 size={12} /> {label}</span>;
  }
  if (source === 'supabase') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"><ShieldCheck size={12} /> {label}</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600"><Info size={12} /> {label}</span>;
}

function sellingSignal(trend: number[]) {
  if (trend.length < 2) {
    return { icon: Lightbulb, title: 'More price history needed', body: 'There are not enough different dates to calculate a reliable movement signal. Do not treat a single price as a forecast.', tone: 'bg-amber-50 text-amber-800' };
  }
  const change = percentChange(trend[0], trend[trend.length - 1]);
  if (change >= 5) {
    return { icon: TrendingUp, title: 'Upward price movement', body: `The tracked average is up ${change.toFixed(1)}% across the available period. Compare storage, transport and urgency before deciding whether to wait.`, tone: 'bg-green-50 text-success-700' };
  }
  if (change <= -5) {
    return { icon: TrendingDown, title: 'Downward price movement', body: `The tracked average is down ${Math.abs(change).toFixed(1)}%. Consider selling sooner if holding costs are significant.`, tone: 'bg-red-50 text-error-700' };
  }
  return { icon: BarChart3, title: 'Market looks broadly stable', body: `The tracked average moved ${change >= 0 ? '+' : ''}${change.toFixed(1)}%. Use your crop quality, storage cost and local buyer demand alongside this signal.`, tone: 'bg-sky-50 text-sky-700' };
}

export default function MarketIntelligencePage() {
  const { user } = useAuth();
  const [crop, setCrop] = useState('Paddy');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [market, setMarket] = useState('');
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [source, setSource] = useState<MarketDataSource>('none');
  const [sourceLabel, setSourceLabel] = useState('No verified market data available');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [memory, setMemory] = useState<FarmerMemory | null>(null);
  const [quantity, setQuantity] = useState('10');
  const [manualPrice, setManualPrice] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    void getFarmerMemory(user.id).then((farmer) => {
      setMemory(farmer);
      if (farmer?.state) setState(farmer.state);
      if (farmer?.district) setDistrict(farmer.district);
      if (farmer?.current_crop) setCrop(farmer.current_crop);
    });
  }, [user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setSearched(false);
    try {
      const result = await getMarketIntelligence({
        crop,
        state: state.trim() || null,
        district: district.trim() || null,
        market: market.trim() || null,
      });
      setPrices(result.prices);
      setSource(result.source);
      setSourceLabel(result.sourceLabel);
      const latest = result.prices[0]?.price;
      if (latest && latest > 0) setManualPrice(String(latest));
    } catch (error) {
      console.error('Market Intelligence load failed:', error);
      setPrices([]);
      setSource('none');
      setSourceLabel(error instanceof Error ? error.message : 'Market data could not be loaded');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [crop, state, district, market]);

  useEffect(() => { void load(); }, [load]);

  const marketOptions = useMemo(() => {
    const values = new Set(prices.map((item) => item.market).filter(Boolean) as string[]);
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [prices]);

  const visiblePrices = useMemo(() => {
    if (!market) return prices;
    return prices.filter((item) => item.market?.toLowerCase() === market.toLowerCase());
  }, [prices, market]);

  const latest = visiblePrices[0];
  const today = new Date().toISOString().slice(0, 10);
  const todayPrices = visiblePrices.filter((item) => item.price_date === today);
  const highToday = todayPrices.length ? Math.max(...todayPrices.map((item) => item.price)) : null;
  const lowToday = todayPrices.length ? Math.min(...todayPrices.map((item) => item.price)) : null;

  const trend = useMemo(() => {
    const grouped = new Map<string, number[]>();
    for (const item of visiblePrices) {
      if (!item.price_date) continue;
      const values = grouped.get(item.price_date) ?? [];
      values.push(item.price);
      grouped.set(item.price_date, values);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, values]) => values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [visiblePrices]);

  const trendChange = trend.length >= 2 ? percentChange(trend[0], trend[trend.length - 1]) : null;
  const signal = sellingSignal(trend);
  const SignalIcon = signal.icon;
  const priceForCalculator = Number(manualPrice);
  const estimate = useMemo(() => {
    const qty = Number(quantity);
    return Number.isFinite(qty) && qty > 0 && Number.isFinite(priceForCalculator) && priceForCalculator > 0 ? qty * priceForCalculator : 0;
  }, [quantity, priceForCalculator]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader icon={BarChart3} title="Market Intelligence" subtitle="Verified Indian mandi prices with transparent source, trend and selling-scenario tools." />

      <GlassCard padding="lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-50 grid place-items-center"><MapPin size={18} className="text-brand-600" /></div>
            <div><h2 className="font-display font-bold text-base text-ink-900">Market Search</h2><p className="text-xs text-ink-500">Government mandi data is queried first when the production API key is configured.</p></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs font-semibold text-ink-700">Crop
              <div className="relative mt-1.5">
                <select value={crop} onChange={(e) => { setCrop(e.target.value); setMarket(''); }} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm text-ink-900 outline-none focus:border-brand-500">
                  {CROPS.map((item) => <option key={item}>{item}</option>)}
                </select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
              </div>
            </label>
            <label className="text-xs font-semibold text-ink-700">State
              <input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Tamil Nadu" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="text-xs font-semibold text-ink-700">District
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Karur" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="text-xs font-semibold text-ink-700">Market
              <div className="relative mt-1.5">
                <select value={market} onChange={(e) => setMarket(e.target.value)} disabled={!marketOptions.length} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm text-ink-900 outline-none focus:border-brand-500 disabled:bg-gray-50 disabled:text-ink-400">
                  <option value="">All available markets</option>{marketOptions.map((item) => <option key={item}>{item}</option>)}
                </select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
              </div>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{loading ? 'Fetching prices…' : 'Refresh market data'}</Button>
            <button onClick={() => { setState(''); setDistrict(''); setMarket(''); }} className="text-xs text-ink-600 underline underline-offset-2 hover:text-brand-600">Clear location</button>
            {memory?.current_crop && <span className="text-xs text-ink-500">Prefilled from Farmer Memory: {memory.current_crop}</span>}
          </div>
        </div>
      </GlassCard>

      {source !== 'none' && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-card"><div className="flex items-center gap-2 text-xs text-ink-600"><ShieldCheck size={15} className="text-brand-600" />Data source</div><DataSourceBadge source={source} label={sourceLabel} /></div>}

      {latest ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-card p-5"><div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Latest available</div><div className="font-display font-bold text-3xl text-brand-700 mt-1">₹{fmt(latest.price)}</div><div className="text-xs text-ink-500 mt-1">{latest.unit ?? '₹/quintal'} · {formatDate(latest.price_date)}</div></div>
          <div className="bg-white rounded-xl shadow-card p-5"><div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Highest today</div><div className="font-display font-bold text-3xl text-ink-900 mt-1">{highToday != null ? `₹${fmt(highToday)}` : '—'}</div><div className="text-xs text-ink-500 mt-1">Based on today's returned records</div></div>
          <div className="bg-white rounded-xl shadow-card p-5"><div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Lowest today</div><div className="font-display font-bold text-3xl text-ink-900 mt-1">{lowToday != null ? `₹${fmt(lowToday)}` : '—'}</div><div className="text-xs text-ink-500 mt-1">{latest.market ?? 'Market not specified'} · {latest.district ?? 'District unavailable'}</div></div>
        </motion.div>
      ) : searched && (
        <GlassCard padding="lg"><div className="flex gap-3"><AlertCircle className="text-amber-600 shrink-0" size={22} /><div><h3 className="font-display font-bold text-lg text-ink-900">No verified market prices found</h3><p className="text-sm text-ink-600 mt-1">{sourceLabel}. Try a broader crop/location search. The app will never substitute a made-up mandi rate.</p></div></div></GlassCard>
      )}

      {visiblePrices.length > 0 && <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard padding="lg"><div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><TrendingUp size={19} className="text-brand-600" /><h2 className="font-display font-bold text-lg text-ink-900">7-Day Price Trend</h2></div>{trendChange !== null && <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${trendChange >= 0 ? 'bg-green-50 text-success-700' : 'bg-red-50 text-error-700'}`}>{trendChange >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{trendChange >= 0 ? '+' : ''}{trendChange.toFixed(1)}%</span>}</div>{trend.length >= 2 ? <Sparkline data={trend} /> : <p className="py-8 text-sm text-ink-600">Not enough date-spread records to draw a trend yet.</p>}<div className="mt-2 flex justify-between text-xs text-ink-500"><span>{trend.length} day{trend.length === 1 ? '' : 's'} represented</span><span>Average price per day</span></div></GlassCard>
        <GlassCard padding="lg"><div className="flex items-center gap-2 mb-4"><Lightbulb size={19} className="text-brand-600" /><h2 className="font-display font-bold text-lg text-ink-900">Selling Signal</h2></div><div className={`rounded-2xl p-4 ${signal.tone} flex gap-3`}><SignalIcon size={22} className="shrink-0 mt-0.5" /><div><div className="font-bold text-sm">{signal.title}</div><p className="text-sm mt-1 leading-relaxed">{signal.body}</p></div></div><p className="mt-3 text-[11px] text-ink-500 flex items-center gap-1"><Info size={12} />This is a rule-based signal from observed verified prices, not a guaranteed future-price prediction.</p></GlassCard>
      </div>}

      {visiblePrices.length > 0 && <GlassCard padding="lg"><div className="flex items-center gap-2 mb-4"><Calculator size={19} className="text-brand-600" /><h2 className="font-display font-bold text-lg text-ink-900">Selling Scenario Calculator</h2></div><p className="text-xs text-ink-500 mb-5">Uses the latest verified price as the initial scenario value. Change it only for a what-if calculation.</p><div className="grid sm:grid-cols-2 gap-4"><label className="text-xs font-semibold text-ink-700">Quantity (quintals)<input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0" step="0.5" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold text-ink-700">Scenario price (₹/quintal)<input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} type="number" min="0" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label></div><div className="mt-5 rounded-2xl bg-brand-50 border border-brand-100 p-5"><div className="text-xs text-brand-700 font-semibold">Estimated gross revenue</div><div className="text-3xl font-display font-bold text-brand-900 mt-1">₹{fmt(estimate)}</div><div className="text-xs text-brand-700 mt-1">Before transport, commission, storage and other expenses.</div></div></GlassCard>}

      <GlassCard padding="lg"><div className="flex items-center gap-2 mb-4"><Wheat size={19} className="text-brand-600" /><h2 className="font-display font-bold text-lg text-ink-900">Recent Verified Market Records</h2><span className="ml-auto text-[11px] text-ink-500">{visiblePrices.length} shown</span></div>{visiblePrices.length ? <div className="space-y-2">{visiblePrices.slice(0, 12).map((item, index) => <motion.div key={item.id ?? `${item.market}-${item.price_date}-${index}`} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"><div className="h-9 w-9 rounded-lg bg-brand-100 grid place-items-center shrink-0"><Wheat size={15} className="text-brand-700" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold text-ink-900 truncate">{item.market ?? 'Market not specified'}</span><span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-success-700"><CheckCircle2 size={9} /> Verified</span></div><div className="text-[11px] text-ink-500 mt-0.5 truncate">{[item.district, item.state].filter(Boolean).join(' · ') || 'Location unavailable'} · {item.crop}</div></div><div className="text-right shrink-0"><div className="font-display font-bold text-sm text-brand-700">₹{fmt(item.price)}</div><div className="text-[10px] text-ink-500">{formatDate(item.price_date)}</div></div></motion.div>)}</div> : <div className="text-center py-8"><div className="h-12 w-12 rounded-2xl bg-brand-50 grid place-items-center mx-auto mb-3"><BarChart3 size={20} className="text-brand-400" /></div><p className="text-sm text-ink-600">No verified records are available for this selection.</p><p className="text-xs text-ink-500 mt-1">A trusted market source must publish the price before it appears here.</p></div>}</GlassCard>
    </div>
  );
}
