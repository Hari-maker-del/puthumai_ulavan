import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import {
  addMarketplaceListing,
  createMarketplaceOrder,
  cancelMarketplaceOrder,
  getMarketplaceListings,
  getMyMarketplaceOrders,
  removeMarketplaceListing,
  updateMarketplaceOrderStatus,
  type MarketplaceCategory,
  type MarketplaceListing,
  type MarketplaceOrder,
} from '@/services/marketplaceService';
import GlassCard from '@/components/ui/GlassCard';
import { Package, Plus, Search, MapPin, ShoppingCart, Tractor, X, Trash2, Wheat, Sprout, Apple, Boxes, Wrench, ClipboardList, Check, Ban } from 'lucide-react';

const categories: Array<{ value: MarketplaceCategory | 'All'; icon: typeof Wheat }> = [
  { value: 'All', icon: Boxes }, { value: 'Crops', icon: Wheat }, { value: 'Seeds', icon: Sprout },
  { value: 'Vegetables', icon: Sprout }, { value: 'Fruits', icon: Apple }, { value: 'Inputs', icon: Package }, { value: 'Equipment', icon: Wrench },
];
const inputClass = 'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

export default function MarketplacePage() {
  const { user } = useAuth();
  const { language } = useI18n();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory | 'All'>('All');
  const [showSell, setShowSell] = useState(false);
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ productName: '', category: 'Crops' as MarketplaceCategory, quantity: '', unit: 'kg', price: '', location: '', description: '' });
  const [orderQty, setOrderQty] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const role = user?.user_metadata?.role === 'farmer' ? 'farmer' : 'visitor';

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [nextListings, nextOrders] = await Promise.all([
        getMarketplaceListings(),
        user ? getMyMarketplaceOrders(user.id) : Promise.resolve([]),
      ]);
      setListings(nextListings); setOrders(nextOrders);
    } catch (err) { setError(err instanceof Error ? err.message : 'Marketplace data could not be loaded.'); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(item => {
      const matchesCategory = category === 'All' || item.category === category;
      const haystack = `${item.productName} ${item.sellerName} ${item.location} ${item.description}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [listings, query, category]);

  const submitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'farmer') return;
    const quantity = Number(form.quantity); const price = Number(form.price);
    if (!form.productName.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0 || !form.location.trim()) {
      setError('Enter a valid product, quantity, price and location.'); return;
    }
    try {
      await addMarketplaceListing({ sellerId: user.id, productName: form.productName.trim(), category: form.category, quantity, unit: form.unit, price, location: form.location.trim(), description: form.description.trim() || 'Farm product available for buyers.', sellerName: user.user_metadata?.name || user.email?.split('@')[0] || 'Farmer' });
      setForm({ productName: '', category: 'Crops', quantity: '', unit: 'kg', price: '', location: '', description: '' });
      setShowSell(false); setMessage('Your product is now listed.'); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not publish the listing.'); }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    const quantity = Number(orderQty);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > selected.availableQuantity) { setError(`Enter a quantity between 0 and ${selected.availableQuantity} ${selected.unit}.`); return; }
    try {
      await createMarketplaceOrder({ listingId: selected.id, buyerId: user.id, quantity, buyerNote: orderNote.trim() || undefined });
      setSelected(null); setOrderQty(''); setOrderNote(''); setMessage('Order request placed. The seller can now accept or reject it.'); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not place the order.'); }
  };

  const cancelOrder = async (order: MarketplaceOrder) => {
    if (!user) return;
    try { await cancelMarketplaceOrder(order.id, user.id); setMessage('Order cancelled and quantity returned to the listing.'); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not cancel the order.'); }
  };

  const updateOrder = async (order: MarketplaceOrder, status: 'accepted' | 'rejected' | 'completed') => {
    if (!user) return;
    try { await updateMarketplaceOrderStatus({ orderId: order.id, userId: user.id, status }); setMessage(`Order marked ${status}.`); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update the order.'); }
  };

  const currency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const dateLabel = (value: string) => new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { day: 'numeric', month: 'short' }).format(new Date(value));

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-brand-700"><ShoppingCart size={20} /><span className="text-sm font-bold">Puthumai Uzhavan</span></div><h1 className="mt-1 font-display text-3xl font-extrabold text-ink-900">Marketplace</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">Buy and sell farm produce, seeds, inputs and equipment directly through the farming community.</p></div>{role === 'farmer' && <button onClick={() => setShowSell(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 font-bold text-white shadow-card hover:bg-brand-700"><Plus size={18} /> List a Product</button>}</div>
    {message && <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Close"><X size={16} /></button></div>}
    {error && <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><span>{error}</span><button onClick={() => setError('')} aria-label="Close"><X size={16} /></button></div>}
    <GlassCard padding="lg"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" /><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-11`} placeholder="Search crops, seeds, equipment or location..." /></label><div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">{categories.map(({ value, icon: Icon }) => <button key={value} onClick={() => setCategory(value)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${category === value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-ink-700 hover:bg-brand-50'}`}><Icon size={15} />{value}</button>)}</div></div></GlassCard>
    {loading ? <GlassCard padding="lg"><p className="py-10 text-center text-sm text-ink-500">Loading marketplace…</p></GlassCard> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <ListingCard key={item.id} item={item} own={item.sellerId === user?.id} onBuy={() => { setSelected(item); setOrderQty(''); }} onDelete={async () => { try { await removeMarketplaceListing(item.id, user!.id); setMessage('Listing removed.'); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove listing.'); } }} currency={currency} dateLabel={dateLabel} />)}</div>}
    {!loading && filtered.length === 0 && <GlassCard padding="lg"><div className="py-10 text-center"><Package className="mx-auto text-ink-300" size={42} /><h2 className="mt-3 font-display text-xl font-bold text-ink-900">No products found</h2><p className="mt-1 text-sm text-ink-500">No live listing matches your search.</p></div></GlassCard>}
    <div className="grid gap-4 md:grid-cols-3"><Info title="For farmers" text="List your harvest and reach buyers through a persistent Supabase marketplace." icon={Tractor} /><Info title="Order flow" text="Buyers submit quantities, sellers accept or reject, and every order is stored securely." icon={ClipboardList} /><Info title="Transparent pricing" text="Every listing shows available quantity, unit, price and location before ordering." icon={Wheat} /></div>
    {user && <GlassCard padding="lg"><div className="flex items-center gap-2"><ClipboardList size={20} className="text-brand-600" /><h2 className="font-display text-xl font-extrabold text-ink-900">My marketplace orders</h2></div>{orders.length === 0 ? <p className="mt-3 text-sm text-ink-500">No marketplace orders yet.</p> : <div className="mt-4 space-y-3">{orders.map(order => <OrderRow key={order.id} order={order} currentUserId={user.id} onStatus={status => status === 'cancelled' ? void cancelOrder(order) : void updateOrder(order, status)} dateLabel={dateLabel} currency={currency} />)}</div>}</GlassCard>}
    {showSell && <Modal title="List a farm product" onClose={() => setShowSell(false)}><form onSubmit={submitListing} className="grid gap-4 sm:grid-cols-2"> <Field label="Product name"><input required className={inputClass} value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Paddy ADT 43" /></Field><Field label="Category"><select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as MarketplaceCategory })}>{categories.slice(1).map(c => <option key={c.value}>{c.value}</option>)}</select></Field><Field label="Quantity"><input required type="number" min="0.01" step="0.01" className={inputClass} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></Field><Field label="Unit"><select className={inputClass} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option>kg</option><option>quintal</option><option>tonne</option><option>piece</option><option>bag</option><option>litre</option></select></Field><Field label="Price per unit"><input required type="number" min="0" step="0.01" className={inputClass} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field><Field label="Village / district"><input required className={inputClass} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Thanjavur, Tamil Nadu" /></Field><div className="sm:col-span-2"><Field label="Description"><textarea rows={3} className={`${inputClass} resize-none`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></div><div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setShowSell(false)} className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-ink-700">Cancel</button><button type="submit" className="rounded-2xl bg-brand-600 px-5 py-3 font-bold text-white">Publish listing</button></div></form></Modal>}
    {selected && <Modal title={`Order ${selected.productName}`} onClose={() => setSelected(null)}><form onSubmit={placeOrder} className="space-y-4"><div className="rounded-2xl bg-brand-50 p-4 text-sm"><p className="font-bold text-ink-900">{currency(selected.price)} / {selected.unit}</p><p className="mt-1 text-ink-600">{selected.availableQuantity.toLocaleString('en-IN')} {selected.unit} available · {selected.location}</p></div><Field label={`Quantity (${selected.unit})`}><input required type="number" min="0.01" max={selected.availableQuantity} step="0.01" className={inputClass} value={orderQty} onChange={e => setOrderQty(e.target.value)} /></Field><Field label="Note to seller"><textarea rows={3} className={`${inputClass} resize-none`} value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="Delivery or quality requirements…" /></Field><p className="text-sm font-bold text-ink-900">Estimated total: {currency((Number(orderQty) || 0) * selected.price)}</p><button type="submit" className="w-full rounded-2xl bg-brand-600 px-5 py-3 font-bold text-white">Place order request</button></form></Modal>}
  </div>;
}

function ListingCard({ item, own, onBuy, onDelete, currency, dateLabel }: { item: MarketplaceListing; own: boolean; onBuy: () => void; onDelete: () => void; currency: (n: number) => string; dateLabel: (s: string) => string }) { return <GlassCard padding="none"><div className="flex h-32 items-center justify-center bg-brand-50 text-brand-700"><Wheat size={48} strokeWidth={1.5} /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{item.category}</span><h3 className="mt-3 font-display text-lg font-extrabold text-ink-900">{item.productName}</h3></div><div className="text-right"><p className="text-lg font-extrabold text-brand-700">{currency(item.price)}</p><p className="text-[11px] text-ink-500">per {item.unit}</p></div></div><p className="mt-2 text-sm leading-5 text-ink-600">{item.description}</p><div className="mt-4 space-y-2 text-xs text-ink-500"><div className="flex items-center gap-2"><Package size={14} /> {item.availableQuantity.toLocaleString('en-IN')} {item.unit} available</div><div className="flex items-center gap-2"><MapPin size={14} /> {item.location}</div></div><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"><span className="text-xs font-semibold text-ink-500">{item.sellerName} · {dateLabel(item.createdAt)}</span>{own ? <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><Trash2 size={14} /> Remove</button> : <button disabled={item.availableQuantity <= 0} onClick={onBuy} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Order</button>}</div></div></GlassCard>; }
function OrderRow({ order, currentUserId, onStatus, dateLabel, currency }: { order: MarketplaceOrder; currentUserId: string; onStatus: (status: 'accepted' | 'rejected' | 'completed' | 'cancelled') => void; dateLabel: (s: string) => string; currency: (n: number) => string }) { const seller = order.sellerId === currentUserId; return <div className="rounded-2xl border border-gray-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-ink-900">{order.productName}</p><p className="mt-1 text-xs text-ink-500">{order.quantity} {order.unit} · {currency(order.totalAmount)} · {dateLabel(order.createdAt)}</p></div><span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold capitalize text-ink-700">{order.status}</span></div>{order.buyerNote && <p className="mt-2 text-sm text-ink-600">Note: {order.buyerNote}</p>}<div className="mt-3 flex flex-wrap gap-2">{seller && order.status === 'pending' && <><button onClick={() => onStatus('accepted')} className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white"><Check size={14} /> Accept</button><button onClick={() => onStatus('rejected')} className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><Ban size={14} /> Reject</button></>}{seller && order.status === 'accepted' && <button onClick={() => onStatus('completed')} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">Mark completed</button>}{!seller && order.status === 'pending' && <button onClick={() => onStatus('cancelled')} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-ink-700">Cancel order</button>}</div></div>; }
function Info({ title, text, icon: Icon }: { title: string; text: string; icon: typeof Wheat }) { return <GlassCard padding="lg"><Icon size={22} className="text-brand-600" /><h3 className="mt-3 font-display text-lg font-extrabold text-ink-900">{title}</h3><p className="mt-1 text-sm leading-6 text-ink-600">{text}</p></GlassCard>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-500">{label}</span>{children}</label>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-extrabold text-ink-900">{title}</h2></div><button onClick={onClose} className="rounded-xl bg-gray-100 p-2" aria-label="Close"><X size={18} /></button></div><div className="mt-6">{children}</div></div></div>; }
