import { useEffect, useState } from 'react';
import { Users, Layers, Sprout, IndianRupee, Bell, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatTile from '@/components/ui/StatTile';
import { getAdminOverview, type AdminOverview } from '@/services/adminOverviewService';

const emptyOverview: AdminOverview = { registered_farmers: 0, total_farms: 0, total_area: 0, current_crops: 0, active_alerts: 0, revenue: 0, expenses: 0, crop_distribution: [], monthly_revenue: [] };

export default function AdminPanelPage() {
  const [data, setData] = useState<AdminOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setData(await getAdminOverview()); } catch (err) { setError(err instanceof Error ? err.message : 'Admin data could not be loaded.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return <div className="space-y-6">
    <PageHeader icon={ShieldCheck} title="Admin Panel" subtitle="Live platform analytics. Values come from the production database." />
    {error && <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><span>{error}</span><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2"><RefreshCw size={15} /> Retry</button></div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatTile icon={Users} label="Registered Farmers" value={loading ? '—' : data.registered_farmers.toLocaleString('en-IN')} />
      <StatTile icon={Layers} label="Total Farms" value={loading ? '—' : data.total_farms.toLocaleString('en-IN')} sub={loading ? undefined : `${data.total_area.toLocaleString('en-IN')} acres`} />
      <StatTile icon={Sprout} label="Current Crops" value={loading ? '—' : data.current_crops.toLocaleString('en-IN')} />
      <StatTile icon={IndianRupee} label="Recorded Revenue" value={loading ? '—' : money(data.revenue)} />
      <StatTile icon={Bell} label="Unread Alerts" value={loading ? '—' : data.active_alerts.toLocaleString('en-IN')} />
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <GlassCard padding="lg"><div className="flex items-center gap-2"><Activity size={18} className="text-brand-600" /><div><div className="font-display font-bold text-ink-900">Recorded Revenue</div><div className="text-xs text-ink-600">Last six months</div></div></div><div className="mt-5 h-64">{data.monthly_revenue.length === 0 ? <div className="grid h-full place-items-center text-sm text-ink-500">No recorded sales yet.</div> : <ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthly_revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => money(Number(value ?? 0))} /><Bar dataKey="revenue" name="Revenue (₹)" /></BarChart></ResponsiveContainer>}</div></GlassCard>
      <GlassCard padding="lg"><div className="font-display font-bold text-ink-900">Crop Distribution</div><div className="mt-4 space-y-3">{data.crop_distribution.length === 0 ? <p className="text-sm text-ink-500">No crop records yet.</p> : data.crop_distribution.map(row => <div key={row.name} className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3"><span className="font-semibold text-ink-800">{row.name}</span><span className="font-bold text-brand-700">{row.value.toLocaleString('en-IN')}</span></div>)}</div></GlassCard>
    </div>
    <GlassCard padding="lg"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold text-ink-900">Live admin data</h2><p className="mt-1 text-sm text-ink-600">Admin analytics are available only to authenticated users with the admin role.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-ink-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wider text-ink-500">Recorded expenses</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{loading ? '—' : money(data.expenses)}</p></div><div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wider text-ink-500">Recorded margin</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{loading ? '—' : money(data.revenue - data.expenses)}</p></div></div></GlassCard>
  </div>;
}
