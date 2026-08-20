import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3, Calculator, Info, RefreshCw, TrendingUp, IndianRupee, MapPin } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatTile from '@/components/ui/StatTile';
import { useAuth } from '@/context/AuthContext';
import { getMarketPrices, type MarketPrice } from '@/services/marketIntelligenceService';
import { getExpenses } from '@/services/expenseService';
import { getFarmerMemory, type FarmerMemory } from '@/services/farmerMemoryService';

const CROPS = ['Paddy', 'Tomato', 'Sugarcane', 'Banana', 'Groundnut', 'Maize', 'Cotton', 'Black gram'];

export default function MarketIntelligencePage() {
  const { user } = useAuth();
  const [crop, setCrop] = useState('Paddy');
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState('2300');
  const [quantity, setQuantity] = useState('10');
  const [expectedYield, setExpectedYield] = useState('10');
  const [totalCost, setTotalCost] = useState('0');
  const [priceChange, setPriceChange] = useState('0');
  const [yieldChange, setYieldChange] = useState('0');
  const [costChange, setCostChange] = useState('0');
  const [memory, setMemory] = useState<FarmerMemory | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setPrices(await getMarketPrices(user.id, crop));
    } finally {
      setLoading(false);
    }
  }, [user?.id, crop]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    void Promise.all([getFarmerMemory(user.id), getExpenses(user.id).catch(() => ({ total: 0 }))]).then(([farmer, expenseResult]) => {
      setMemory(farmer);
      if (farmer?.previous_yield_kg && farmer.previous_yield_kg > 0) setExpectedYield(String((farmer.previous_yield_kg / 100).toFixed(1)));
      if (expenseResult && 'total' in expenseResult) setTotalCost(String(Math.round(expenseResult.total)));
    });
  }, [user?.id]);

  const latest = prices[0];
  const previous = prices[1];
  const change = latest && previous ? latest.price - previous.price : null;
  const changePct = latest && previous && previous.price ? (change! / previous.price) * 100 : null;

  const estimate = useMemo(() => {
    const price = Number(currentPrice);
    const qty = Number(quantity);
    return Number.isFinite(price) && Number.isFinite(qty) ? price * qty : 0;
  }, [currentPrice, quantity]);

  const profitScenario = useMemo(() => {
    const basePrice = Number(currentPrice);
    const baseYield = Number(expectedYield);
    const baseCost = Number(totalCost);
    const pDelta = Number(priceChange) / 100;
    const yDelta = Number(yieldChange) / 100;
    const cDelta = Number(costChange) / 100;
    const revenue = Math.max(0, basePrice * (1 + pDelta) * baseYield * (1 + yDelta));
    const cost = Math.max(0, baseCost * (1 + cDelta));
    const profit = revenue - cost;
    return { revenue, cost, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
  }, [currentPrice, expectedYield, totalCost, priceChange, yieldChange, costChange]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Market Intelligence"
        subtitle="Track available farm prices and explore your own selling scenarios."
      />

      <GlassCard padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">Crop</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500">
              {CROPS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <Button onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </GlassCard>

      {latest ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatTile icon={IndianRupee} label="Latest available price" value={`₹${latest.price.toLocaleString('en-IN')}`} sub={latest.unit ?? 'per quintal'} accent="from-brand-500 to-brand-700" />
          <StatTile icon={change !== null && change >= 0 ? ArrowUp : ArrowDown} label="Price movement" value={change === null ? '—' : `${change >= 0 ? '+' : ''}₹${change.toLocaleString('en-IN')}`} sub={changePct === null ? 'Need 2 records for trend' : `${changePct.toFixed(1)}% vs previous record`} accent="from-accent-500 to-accent-700" />
          <StatTile icon={MapPin} label="Market" value={latest.market ?? 'Not specified'} sub={latest.district ?? 'Location unavailable'} accent="from-sky-500 to-sky-700" />
        </div>
      ) : (
        <GlassCard padding="lg">
          <div className="flex gap-3">
            <Info className="text-amber-600 shrink-0" size={20} />
            <div>
              <div className="font-semibold text-ink-900">Live market data is not connected yet</div>
              <p className="text-sm text-ink-600 mt-1">
                No verified market-price records are available for this farmer. The calculator below is based only on the price you enter; it does not pretend to be a live mandi rate.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard padding="lg">
          <div className="flex items-center gap-2">
            <TrendingUp size={19} className="text-brand-600" />
            <h2 className="font-display font-bold text-lg text-ink-900">Available price records</h2>
          </div>
          {prices.length ? (
            <div className="mt-4 space-y-2">
              {prices.slice(0, 6).map((item, index) => (
                <div key={item.id || `${item.crop}-${index}`} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{item.market ?? 'Market not specified'}</div>
                    <div className="text-xs text-ink-500">{item.price_date ? new Date(item.price_date).toLocaleDateString('en-IN') : 'Date unavailable'} · {item.source ?? 'User-linked data'}</div>
                  </div>
                  <div className="text-sm font-bold text-brand-700">₹{item.price.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-600">Connect a verified market source or add market records to Supabase to see prices here.</p>
          )}
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center gap-2">
            <Calculator size={19} className="text-brand-600" />
            <h2 className="font-display font-bold text-lg text-ink-900">Selling scenario calculator</h2>
          </div>
          <p className="text-xs text-ink-500 mt-1">What-if calculation only — not a live price prediction.</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <label className="text-xs font-semibold text-ink-700">
              Price (₹/quintal)
              <input value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} type="number" min="0"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-semibold text-ink-700">
              Quantity (quintals)
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </label>
          </div>
          <div className="mt-5 rounded-2xl bg-brand-50 p-5">
            <div className="text-xs text-brand-700 font-semibold">Estimated gross revenue</div>
            <div className="text-3xl font-display font-bold text-brand-800 mt-1">₹{estimate.toLocaleString('en-IN')}</div>
            <div className="text-xs text-brand-700 mt-1">Before expenses, commissions and transport.</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <div className="flex items-center gap-2">
          <TrendingUp size={19} className="text-brand-600" />
          <h2 className="font-display font-bold text-lg text-ink-900">Farm Profit Decision Simulator</h2>
        </div>
        <p className="text-xs text-ink-500 mt-1">What-if planning using your recorded costs and expected/previous yield. It does not predict a future market price.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          <label className="text-xs font-semibold text-ink-700">Expected yield (quintals)
            <input value={expectedYield} onChange={(e) => setExpectedYield(e.target.value)} type="number" min="0" step="0.1" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-ink-700">Recorded farm costs (₹)
            <input value={totalCost} onChange={(e) => setTotalCost(e.target.value)} type="number" min="0" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-ink-700">Selling price (₹/quintal)
            <input value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} type="number" min="0" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-ink-700">Price change (%)
            <input value={priceChange} onChange={(e) => setPriceChange(e.target.value)} type="number" min="-100" step="1" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-ink-700">Yield change (%)
            <input value={yieldChange} onChange={(e) => setYieldChange(e.target.value)} type="number" min="-100" step="1" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-ink-700">Cost change (%)
            <input value={costChange} onChange={(e) => setCostChange(e.target.value)} type="number" min="-100" step="1" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-brand-50 p-4"><div className="text-xs text-brand-700">Scenario revenue</div><div className="text-2xl font-display font-bold text-brand-900 mt-1">₹{profitScenario.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div></div>
          <div className="rounded-2xl bg-amber-50 p-4"><div className="text-xs text-amber-700">Scenario cost</div><div className="text-2xl font-display font-bold text-amber-900 mt-1">₹{profitScenario.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div></div>
          <div className={`rounded-2xl p-4 ${profitScenario.profit >= 0 ? 'bg-sky-50' : 'bg-red-50'}`}><div className="text-xs text-sky-700">Estimated profit</div><div className={`text-2xl font-display font-bold mt-1 ${profitScenario.profit >= 0 ? 'text-sky-900' : 'text-red-800'}`}>₹{profitScenario.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div><div className="text-[10px] text-ink-500 mt-1">Margin {profitScenario.margin.toFixed(1)}%</div></div>
        </div>
        <div className="mt-4 flex gap-2 text-xs text-ink-600"><Info size={15} className="text-brand-600 shrink-0" /><span>{memory?.current_crop ? `Scenario is prefilled for your recorded crop: ${memory.current_crop}.` : 'Add your current crop and farm records in Farmer Memory for better defaults.'} Costs come from your recorded expenses when available.</span></div>
      </GlassCard>
    </div>
  );
}

