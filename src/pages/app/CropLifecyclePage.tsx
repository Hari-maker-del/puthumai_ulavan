import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Circle, ChevronRight, Leaf, Loader2, MapPin, Sprout } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateCropLifecycle, getCropLifecycleStages, type CropLifecycleState, type CropLifecycleStageRule } from '@/services/cropLifecycleEngine';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';

type Farm = { id: string; name: string; location?: string | null; village?: string | null; district?: string | null };
type Field = { id: string; name: string; farm_id?: string | null; area_acres?: number | null; crop?: string | null; stage?: string | null; health?: number | null };
type Crop = { id: string; farm_id?: string | null; field?: string | null; name: string; variety?: string | null; area_acres?: number | null; stage?: string | null; health?: number | null; planted_at?: string | null };
type Cycle = { id: string; fieldId: string; fieldName: string; farmName: string; location: string; crop: string; variety: string; area: number; stage?: string | null; health: number | null; plantedAt: string | null; lifecycle: CropLifecycleState };

const clean = (v?: string | null) => String(v ?? '').trim();
function locationOf(farm?: Farm) { return clean(farm?.location) || [farm?.village, farm?.district].map(clean).filter(Boolean).join(', ') || 'Location not recorded'; }
function dateText(v?: string | null) { if (!v) return 'Not recorded'; const d = new Date(v); return Number.isNaN(d.getTime()) ? 'Not recorded' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function resolveStage(lifecycle: CropLifecycleState, stored: string | null | undefined, stages: CropLifecycleStageRule[]) { const value = clean(stored || lifecycle.stage).toLowerCase(); if (!value) return null; return stages.find((s) => { const key = s.key.toLowerCase(); const name = s.name.toLowerCase(); return value === key || value === name || value.includes(key) || value.includes(name) || name.includes(value); }) ?? null; }
function makeCycle(crop: Crop, field: Field, farm?: Farm): Cycle { const lifecycle = calculateCropLifecycle(crop.name, crop.planted_at ?? undefined); return { id: crop.id, fieldId: field.id, fieldName: field.name, farmName: farm?.name ?? 'Farm not recorded', location: locationOf(farm), crop: crop.name, variety: crop.variety ?? 'Variety not recorded', area: Number(crop.area_acres ?? field.area_acres ?? 0), stage: crop.stage ?? field.stage, health: crop.health ?? field.health ?? null, plantedAt: crop.planted_at ?? null, lifecycle }; }

export default function CropLifecyclePage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const [farmsResult, fieldsResult, cropsResult] = await Promise.all([
          supabase.from('farms').select('id,name,location,village,district').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('fields').select('id,name,farm_id,area_acres,crop,stage,health').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('crops').select('id,farm_id,field,name,variety,area_acres,stage,health,planted_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        ]);
        if (farmsResult.error) throw new Error(farmsResult.error.message);
        if (fieldsResult.error) throw new Error(fieldsResult.error.message);
        if (cropsResult.error) throw new Error(cropsResult.error.message);
        const farms = (farmsResult.data ?? []) as Farm[];
        const fields = (fieldsResult.data ?? []) as Field[];
        const crops = (cropsResult.data ?? []) as Crop[];
        const farmMap = new Map(farms.map((f) => [f.id, f]));
        const fieldsById = new Map(fields.map((f) => [f.id, f]));
        const fieldsByName = new Map(fields.map((f) => [`${f.farm_id ?? ''}|${clean(f.name).toLowerCase()}`, f]));
        const result: Cycle[] = [];
        const represented = new Set<string>();
        for (const crop of crops) {
          const fieldId = clean((crop as Crop & { field_id?: string }).field_id);
          const field = fieldsById.get(fieldId) ?? fieldsByName.get(`${crop.farm_id ?? ''}|${clean(crop.field).toLowerCase()}`);
          if (!field) continue;
          result.push(makeCycle(crop, field, farmMap.get(crop.farm_id ?? field.farm_id ?? '')));
          represented.add(`${field.id}|${clean(crop.name).toLowerCase()}`);
        }
        for (const field of fields) {
          if (!clean(field.crop)) continue;
          const key = `${field.id}|${clean(field.crop).toLowerCase()}`;
          if (represented.has(key)) continue;
          result.push(makeCycle({ id: `field-${field.id}`, farm_id: field.farm_id, field: field.name, name: field.crop, area_acres: field.area_acres, stage: field.stage, health: field.health }, field, farmMap.get(field.farm_id ?? '')));
        }
        result.sort((a, b) => a.location.localeCompare(b.location) || a.farmName.localeCompare(b.farmName) || a.fieldName.localeCompare(b.fieldName) || a.crop.localeCompare(b.crop));
        if (!active) return;
        setCycles(result); setSelectedId(result[0]?.id ?? null);
      } catch (err) {
        if (!active) return;
        console.error('Crop lifecycle load failed:', err); setError(err instanceof Error ? err.message : 'Could not load crop lifecycle data.'); setCycles([]);
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user?.id]);

  const locations = useMemo(() => ['All locations', ...Array.from(new Set(cycles.map((c) => c.location)))], [cycles]);
  const filtered = useMemo(() => locationFilter === 'All locations' ? cycles : cycles.filter((c) => c.location === locationFilter), [cycles, locationFilter]);
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;
  const stages = useMemo(() => selected ? getCropLifecycleStages(selected.crop) : [], [selected]);
  const currentStage = selected ? resolveStage(selected.lifecycle, selected.stage, stages) : null;
  const stageIndex = currentStage ? stages.findIndex((s) => s.key === currentStage.key) : -1;
  const progress = selected?.lifecycle.progress ?? (stageIndex >= 0 && stages.length ? Math.round(((stageIndex + 1) / stages.length) * 100) : null);

  useEffect(() => { if (selected && selected.id !== selectedId) setSelectedId(selected.id); }, [selected, selectedId]);

  return <div className="space-y-6">
    <PageHeader icon={Sprout} title="Crop Lifecycle" subtitle="Track every crop cycle separately across farms, locations and fields." />
    {loading ? <GlassCard padding="lg" className="grid place-items-center py-16"><Loader2 size={28} className="animate-spin text-brand-600" /><p className="mt-3 text-sm text-ink-600">Loading all field crop cycles…</p></GlassCard> : error ? <GlassCard padding="lg" className="border-rose-100 bg-rose-50/70"><div className="flex gap-3"><AlertCircle className="text-rose-600" size={20} /><div><p className="font-semibold text-rose-900">Could not load crop cycles</p><p className="text-sm text-rose-800 mt-1">{error}</p></div></div></GlassCard> : cycles.length === 0 ? <GlassCard padding="lg" className="border-amber-100 bg-amber-50/70"><div className="flex gap-3"><AlertCircle className="text-amber-600" size={20} /><div><p className="font-semibold text-amber-900">No crop cycles found</p><p className="text-sm text-amber-800 mt-1">Add crops to your farm fields. Each field will appear separately here.</p></div></div></GlassCard> : <>
      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-5 sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-bold text-brand-700"><Leaf size={13} /> Multi-field crop management</div><h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">Every field has its own crop cycle</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">Multiple farms, locations, fields and crops remain separate, so one crop never overwrites another field's lifecycle.</p></div><div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white/90 px-3 py-3 text-center"><p className="text-xl font-bold text-ink-900">{new Set(cycles.map((c) => c.location)).size}</p><p className="text-[11px] text-ink-500">Locations</p></div><div className="rounded-2xl bg-white/90 px-3 py-3 text-center"><p className="text-xl font-bold text-ink-900">{new Set(cycles.map((c) => c.fieldId)).size}</p><p className="text-[11px] text-ink-500">Fields</p></div><div className="rounded-2xl bg-white/90 px-3 py-3 text-center"><p className="text-xl font-bold text-ink-900">{cycles.length}</p><p className="text-[11px] text-ink-500">Crop cycles</p></div></div></div></section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-ink-900">My crop cycles</h2><p className="text-xs text-ink-500">Filter by location and select any field.</p></div><div className="flex flex-wrap gap-2">{locations.map((location) => <button key={location} type="button" onClick={() => setLocationFilter(location)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${locationFilter === location ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}>{location}</button>)}</div></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]"><section className="space-y-3">{filtered.map((cycle) => { const cycleStages = getCropLifecycleStages(cycle.crop); const cycleStage = resolveStage(cycle.lifecycle, cycle.stage, cycleStages); const active = selected?.id === cycle.id; return <button key={cycle.id} type="button" onClick={() => setSelectedId(cycle.id)} className={`w-full rounded-2xl border p-5 text-left transition ${active ? 'border-brand-200 bg-brand-50/70 shadow-sm' : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'}`}><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50"><Sprout size={21} className="text-brand-600" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-bold text-ink-900">{cycle.crop}</h3>{cycleStage && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{cycleStage.name}</span>}</div><p className="mt-1 text-sm text-ink-600">{cycle.farmName} · {cycle.fieldName}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500"><span className="inline-flex items-center gap-1"><MapPin size={13} />{cycle.location}</span><span>{cycle.area.toFixed(1)} ac</span><span>{cycle.variety}</span></div></div><ChevronRight size={19} className={active ? 'text-brand-600' : 'text-slate-400'} /></div></button>; })}</section>
        {selected && <GlassCard padding="lg" className="h-fit"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Selected crop cycle</p><h2 className="mt-1 font-display text-2xl font-bold text-ink-900">{selected.crop}</h2><p className="mt-1 text-sm text-ink-600">{selected.farmName} · {selected.fieldName}</p></div><div className="rounded-xl bg-brand-50 p-3"><Leaf className="text-brand-600" size={22} /></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-[11px] text-ink-500">Location</p><p className="mt-1 text-sm font-semibold text-ink-900">{selected.location}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[11px] text-ink-500">Area</p><p className="mt-1 text-sm font-semibold text-ink-900">{selected.area.toFixed(1)} acres</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[11px] text-ink-500">Variety</p><p className="mt-1 text-sm font-semibold text-ink-900">{selected.variety}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[11px] text-ink-500">Planted</p><p className="mt-1 text-sm font-semibold text-ink-900">{dateText(selected.plantedAt)}</p></div></div>{progress !== null && <div className="mt-5"><div className="flex justify-between text-xs font-semibold text-ink-700"><span>Lifecycle progress</span><span>{progress}%</span></div><div className="mt-2 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div></div>}<div className="mt-6"><h3 className="font-display font-bold text-ink-900">Crop stages</h3><div className="mt-4 space-y-3">{stages.map((stage, index) => { const done = stageIndex >= 0 && index < stageIndex; const current = currentStage?.key === stage.key; return <div key={stage.key} className="flex gap-3"><div className="flex flex-col items-center">{done ? <CheckCircle2 size={20} className="text-brand-600" /> : current ? <CalendarDays size={20} className="text-amber-500" /> : <Circle size={20} className="text-slate-300" />}{index < stages.length - 1 && <div className="mt-1 h-5 w-px bg-slate-200" />}</div><div className="pb-1"><p className={`text-sm font-semibold ${current ? 'text-amber-700' : done ? 'text-brand-700' : 'text-ink-600'}`}>{stage.name}{current && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px]">Current</span>}</p>{stage.startDay !== undefined && stage.endDay !== undefined && <p className="text-[11px] text-ink-500">Day {stage.startDay}–{stage.endDay}</p>}</div></div>; })}</div></div></GlassCard>}
      </div>
    </>}
  </div>;
}
