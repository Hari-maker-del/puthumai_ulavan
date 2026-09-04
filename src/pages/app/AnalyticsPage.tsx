import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, IndianRupee, Percent, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatTile from '@/components/ui/StatTile';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Expense = { date: string; amount: number; category: string };
type Sale = { sold_at: string; quantity: number; unit_price: number };

const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 };

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    setLoading(true);
    void Promise.all([
      supabase.from('expenses').select('date,amount,category').eq('user_id', user.id),
      supabase.from('farm_sales').select('sold_at,quantity,unit_price').eq('user_id', user.id),
    ]).then(([expenseResult, salesResult]) => {
      if (!active) return;
      if (!expenseResult.error) setExpenses((expenseResult.data ?? []).map((row) => ({ date: String(row.date), amount: Number(row.amount ?? 0), category: String(row.category ?? 'Other') })));
      if (!salesResult.error) setSales((salesResult.data ?? []).map((row) => ({ sold_at: String(row.sold_at), quantity: Number(row.quantity ?? 0), unit_price: Number(row.unit_price ?? 0) })));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, row) => sum + Math.max(0, row.amount), 0), [expenses]);
  const totalRevenue = useMemo(() => sales.reduce((sum, row) => sum + Math.max(0, row.quantity * row.unit_price), 0), [sales]);
  const profit = totalRevenue - totalExpenses;
  const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : null;

  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      revenue: sales.filter((row) => row.sold_at.startsWith(key)).reduce((sum, row) => sum + Math.max(0, row.quantity * row.unit_price), 0),
      expenses: expenses.filter((row) => row.date.startsWith(key)).reduce((sum, row) => sum + Math.max(0, row.amount), 0),
    };
  }), [expenses, sales]);

  const categoryData = useMemo(() => Object.entries(expenses.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + Math.max(0, row.amount);
    return acc;
  }, {})).map(([name, value]) => ({ name, value })), [expenses]);

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Analytics" subtitle="Revenue, expenses, profit and ROI from your recorded farm transactions." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={IndianRupee} label="Recorded Revenue" value={loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN')}`} sub="from farm sales" accent="bg-brand-600" />
        <StatTile icon={Wallet} label="Recorded Expenses" value={loading ? '—' : `₹${totalExpenses.toLocaleString('en-IN')}`} sub="from expense records" accent="bg-amber-600" delay={0.06} />
        <StatTile icon={TrendingUp} label="Net Profit" value={loading ? '—' : `₹${profit.toLocaleString('en-IN')}`} sub="revenue minus expenses" accent="bg-emerald-600" delay={0.12} />
        <StatTile icon={Percent} label="ROI" value={roi === null ? '—' : `${roi.toFixed(1)}%`} sub="requires recorded expenses" accent="bg-accent-600" delay={0.18} />
      </div>

      <GlassCard padding="lg">
        <div className="font-display font-bold text-ink-900">Revenue vs Expenses</div>
        <div className="text-xs text-ink-600 mt-0.5">Last 6 months from your transaction records</div>
        <div className="mt-5 h-72">
          {monthlyData.some((row) => row.revenue || row.expenses) ? (
            <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip contentStyle={tooltipStyle} formatter={(v) => `₹${Number(v ?? 0).toLocaleString('en-IN')}`} /><Legend /><Bar dataKey="revenue" fill="#16a34a" name="Revenue" /><Bar dataKey="expenses" fill="#f59e0b" name="Expenses" /></BarChart></ResponsiveContainer>
          ) : <div className="h-full grid place-items-center text-sm text-ink-500">No sales or expense records are available for the selected period.</div>}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <div className="font-display font-bold text-ink-900">Expense Distribution</div>
        <div className="text-xs text-ink-600 mt-0.5">Recorded spending by category</div>
        {categoryData.length ? <div className="mt-4 space-y-2">{categoryData.map((item) => <div key={item.name} className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" /><span className="flex-1 text-sm text-ink-700">{item.name}</span><span className="font-bold text-ink-900">₹{item.value.toLocaleString('en-IN')}</span></div>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-ink-500">No expense records yet.</div>}
      </GlassCard>

      {monthlyData.some((row) => row.revenue || row.expenses) && <GlassCard padding="lg"><div className="font-display font-bold text-ink-900 mb-4">Monthly Summary</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] font-bold uppercase tracking-wider text-ink-600 border-b border-gray-100"><th className="pb-3">Month</th><th className="pb-3 text-right">Revenue</th><th className="pb-3 text-right">Expenses</th><th className="pb-3 text-right">Profit</th></tr></thead><tbody className="divide-y divide-ink-900/5">{monthlyData.map((row, i) => <motion.tr key={row.month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}><td className="py-3 font-bold text-ink-900">{row.month}</td><td className="py-3 text-right">₹{row.revenue.toLocaleString('en-IN')}</td><td className="py-3 text-right">₹{row.expenses.toLocaleString('en-IN')}</td><td className="py-3 text-right font-bold text-brand-600">₹{(row.revenue - row.expenses).toLocaleString('en-IN')}</td></motion.tr>)}</tbody></table></div></GlassCard>}
    </div>
  );
}
