import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Leaf,
  Loader2,
  MapPin,
  Sprout,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateCropLifecycle, type CropLifecycleState } from '../../services/cropLifecycleEngine';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';

type CropStageKey = 'sowing' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';

interface FarmRow {
  id: string;
  name: string;
  location?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
}

interface FieldRow {
  id: string;
  name: string;
  farm_id?: string | null;
  location?: string | null;
  area_acres?: number | null;
  crop?: string | null;
  stage?: string | null;
  health?: number | null;
}

interface CropRow {
  id: string;
  farm_id?: string | null;
  field?: string | null;
  name: string;
  variety?: string | null;
  area_acres?: number | null;
  stage?: string | null;
  health?: number | null;
  planted_at?: string | null;
}

interface CropCycle {
  id: string;
  fieldId: string;
  fieldName: string;
  farmId?: string;
  farmName: string;
  location: string;
  crop: string;
  variety: string;
  area: number;
  stage: string;
  health: number | null;
  plantedAt: string | null;
  lifecycle: CropLifecycleState;
}

const STAGES: CropStageKey[] = ['sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'harvest'];
const STAGE_LABELS: Record<CropStageKey, string> = {
  sowing: 'Sowing',
  germination: 'Germination',
  vegetative: 'Vegetative',
  flowering: 'Flowering',
  fruiting: 'Fruiting',
  harvest: 'Harvest',
};

const STAGE_DESCRIPTIONS: Record<CropStageKey, string> = {
  sowing: 'Seed or transplanting stage',
  germination: 'Early establishment',
  vegetative: 'Leaf and plant growth',
  flowering: 'Flower development',
  fruiting: 'Fruit or grain development',
  harvest: 'Harvest stage',
};

function clean(value?: string | null) {
  return String(value ?? '').trim();
}

function normalizeStage(value?: string | null): CropStageKey | null {
  const text = clean(value).toLowerCase();
  if (!text) return null;
  if (text.includes('sow') || text.includes('transplant')) return 'sowing';
  if (text.includes('germin')) return 'germination';
  if (text.includes('veget')) return 'vegetative';
  if (text.includes('flower')) return 'flowering';
  if (text.includes('fruit') || text.includes('grain fill')) return 'fruiting';
  if (text.includes('harvest') || text.includes('matur')) return 'harvest';
  return null;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function locationLabel(farm?: FarmRow, field?: FieldRow) {
  const direct = clean(field?.location) || clean(farm?.location);
  if (direct) return direct;
  return [field?.location, farm?.village, farm?.district, farm?.state]
    .map(clean)
    .filter(Boolean)
    .join(', ') || 'Location not recorded';
}

function resolveLifecycleStage(
  lifecycle: CropLifecycleState,
  storedStage?: string | null,
) {
  return normalizeStage(storedStage) || normalizeStage(lifecycle.stage);
}

function buildCycle(
  crop: CropRow,
  field: FieldRow,
  farm?: FarmRow,
): CropCycle {
  const lifecycle = calculateCropLifecycle(crop.name, crop.planted_at ?? undefined);
  const storedStage = crop.stage ?? field.stage;

  return {
    id: crop.id,
    fieldId: field.id,
    fieldName: field.name,
    farmId: crop.farm_id ?? field.farm_id ?? undefined,
    farmName: farm?.name ?? 'Farm not recorded',
    location: locationLabel(farm, field),
    crop: crop.name,
    variety: crop.variety ?? 'Variety not recorded',
    area: Number(crop.area_acres ?? field.area_acres ?? 0),
    stage: storedStage ?? lifecycle.stage,
    health: crop.health ?? field.health ?? null,
    plantedAt: crop.planted_at ?? null,
    lifecycle,
  };
}

export default function CropLifecyclePage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [farmsResult, fieldsResult, cropsResult] = await Promise.all([
          supabase.from('farms').select('id,name,location,village,district,state').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('fields').select('id,name,farm_id,location,area_acres,crop,stage,health').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('crops').select('id,farm_id,field,name,variety,area_acres,stage,health,planted_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        ]);

        if (farmsResult.error) throw new Error(farmsResult.error.message);
        if (fieldsResult.error) throw new Error(fieldsResult.error.message);
        if (cropsResult.error) throw new Error(cropsResult.error.message);

        const farms = (farmsResult.data ?? []) as FarmRow[];
        const fields = (fieldsResult.data ?? []) as FieldRow[];
        const crops = (cropsResult.data ?? []) as CropRow[];
        const farmMap = new Map(farms.map((farm) => [farm.id, farm]));
        const fieldsByName = new Map<string, FieldRow>();
        const fieldsById = new Map<string, FieldRow>();

        for (const field of fields) {
          fieldsById.set(field.id, field);
          fieldsByName.set(`${field.farm_id ?? ''}|${clean(field.name).toLowerCase()}`, field);
        }

        const result: CropCycle[] = [];
        const usedCropIds = new Set<string>();

        for (const crop of crops) {
          const matchingField =
            fieldsById.get(clean((crop as CropRow & { field_id?: string }).field_id)) ||
            fieldsByName.get(`${crop.farm_id ?? ''}|${clean(crop.field).toLowerCase()}`);

          if (matchingField) {
            result.push(buildCycle(crop, matchingField, farmMap.get(crop.farm_id ?? matchingField.farm_id ?? '')));
            usedCropIds.add(crop.id);
          }
        }

        for (const field of fields) {
          if (!field.crop) continue;
          const syntheticId = `field-${field.id}`;
          const alreadyRepresented = result.some((cycle) => cycle.fieldId === field.id && cycle.crop.toLowerCase() === clean(field.crop).toLowerCase());
          if (alreadyRepresented) continue;

          const syntheticCrop: CropRow = {
            id: syntheticId,
            farm_id: field.farm_id,
            field: field.name,
            name: field.crop,
            area_acres: field.area_acres,
            stage: field.stage,
            health: field.health,
            planted_at: null,
          };

          result.push(buildCycle(syntheticCrop, field, farmMap.get(field.farm_id ?? '')));
        }

        result.sort((a, b) => a.location.localeCompare(b.location) || a.fieldName.localeCompare(b.fieldName) || a.crop.localeCompare(b.crop));

        if (!active) return;
        setCycles(result);
        setSelectedId(result[0]?.id ?? null);
      } catch (err) {
        if (!active) return;
        console.error('Crop lifecycle load failed:', err);
        setError(err instanceof Error ? err.message : 'Could not load crop lifecycle data.');
        setCycles([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const locations = useMemo(
    () => ['All locations', ...Array.from(new Set(cycles.map((cycle) => cycle.location)))],
    [cycles],
  );

  const filteredCycles = useMemo(
    () => locationFilter === 'All locations' ? cycles : cycles.filter((cycle) => cycle.location === locationFilter),
    [cycles, locationFilter],
  );

  const selected = filteredCycles.find((cycle) => cycle.id === selectedId) ?? filteredCycles[0] ?? null;
  const selectedStage = selected ? resolveLifecycleStage(selected.lifecycle, selected.stage) : null;
  const selectedIndex = selectedStage ? STAGES.indexOf(selectedStage) : -1;
  const completedCount = selectedIndex < 0 ? 0 : selectedIndex;
  const progress = selected?.lifecycle.progress ?? (selectedIndex >= 0 ? Math.round(((selectedIndex + 1) / STAGES.length) * 100) : 0);

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sprout}
        title="Crop Lifecycle"
        subtitle="Track every active crop across your locations, farms and fields — each cycle has its own stage and dates."
      />

      {loading ? (
        <GlassCard padding="lg" className="grid place-items-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
          <p className="mt-3 text-sm text-ink-600">Loading all field crop cycles…</p>
        </GlassCard>
      ) : error ? (
        <GlassCard padding="lg" className="border-rose-100 bg-rose-50/70">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Could not load crop cycles</p>
              <p className="mt-1 text-sm text-rose-800">{error}</p>
            </div>
          </div>
        </GlassCard>
      ) : cycles.length === 0 ? (
        <GlassCard padding="lg" className="border-amber-100 bg-amber-50/70">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">No crop cycles found</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">Add crops to your fields in the Farm Profile / crop records first. This page will then show each field separately.</p>
            </div>
          </div>
        </GlassCard>
      ) : (
        <>
          <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-bold text-brand-700">
                  <Leaf size={13} /> Multi-field crop management
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">Every field has its own crop cycle</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">Switch between locations and fields to see the correct crop, stage, planting date and harvest timing. Nothing is treated as one global crop.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white bg-white/90 px-3 py-3 text-center shadow-sm"><p className="text-xl font-bold text-ink-900">{new Set(cycles.map((cycle) => cycle.location)).size}</p><p className="text-[11px] text-ink-500">Locations</p></div>
                <div className="rounded-2xl border border-white bg-white/90 px-3 py-3 text-center shadow-sm"><p className="text-xl font-bold text-ink-900">{new Set(cycles.map((cycle) => cycle.fieldId)).size}</p><p className="text-[11px] text-ink-500">Fields</p></div>
                <div className="rounded-2xl border border-white bg-white/90 px-3 py-3 text-center shadow-sm"><p className="text-xl font-bold text-ink-900">{cycles.length}</p><p className="text-[11px] text-ink-500">Crop cycles</p></div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">My crop cycles</h2>
              <p className="text-xs text-ink-500">Choose a location to focus the field list.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => setLocationFilter(location)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${locationFilter === location ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
            <section className="space-y-3">
              {filteredCycles.map((cycle) => {
                const stage = resolveLifecycleStage(cycle.lifecycle, cycle.stage);
                const isSelected = selected?.id === cycle.id;
                return (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setSelectedId(cycle.id)}
                    className={`w-full rounded-2xl border p-5 text-left transition ${isSelected ? 'border-brand-200 bg-brand-50/70 shadow-sm' : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-brand-100"><Sprout size={21} className="text-brand-600" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-bold text-ink-900">{cycle.crop}</h3>
                          {stage && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{STAGE_LABELS[stage]}</span>}
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{cycle.farmName} · {cycle.fieldName}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1"><MapPin size={13} />{cycle.location}</span>
                          <span>{cycle.area.toFixed(1)} ac</span>
                          <span>{cycle.variety}</span>
                        </div>
                      </div>
                      <ChevronRight size={19} className={`mt-1 shrink-0 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </section>

            {selected && (
              <GlassCard padding="lg" className="h-fit">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Selected crop cycle</p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-ink-900">{selected.crop}</h2>
                    <p className="mt-1 text-sm text-ink-600">{selected.farmName} · {selected.fieldName}</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50"><Sprout size={21} className="text-brand-600" /></div>
                </div>

                <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold text-ink-800">Lifecycle progress</span><span className="font-bold text-brand-700">{progress}%</span></div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
                  <p className="mt-2 text-xs text-ink-500">{selected.lifecycle.day != null && selected.lifecycle.expectedDuration != null ? `Day ${selected.lifecycle.day} of ${selected.lifecycle.expectedDuration}` : 'Progress is based on the saved stage because a crop-duration rule is not available.'}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Current stage</p><p className="mt-2 font-display text-lg font-bold text-ink-900">{selectedStage ? STAGE_LABELS[selectedStage] : selected.stage || 'Not recorded'}</p></div>
                  <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Health</p><p className="mt-2 font-display text-lg font-bold text-ink-900">{selected.health == null ? 'Not recorded' : `${Math.round(selected.health)}%`}</p></div>
                  <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Planted</p><p className="mt-2 font-display text-lg font-bold text-ink-900">{formatDate(selected.plantedAt)}</p></div>
                  <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Expected harvest</p><p className="mt-2 font-display text-lg font-bold text-ink-900">{selected.plantedAt && selected.lifecycle.expectedDuration ? formatDate(new Date(new Date(selected.plantedAt).getTime() + selected.lifecycle.expectedDuration * 86400000).toISOString()) : 'Not calculated'}</p></div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold text-ink-900">Crop journey</h3><span className="text-xs text-ink-500">{completedCount} of {STAGES.length} completed</span></div>
                  <div className="mt-4 space-y-3">
                    {STAGES.map((stage, index) => {
                      const done = selectedIndex >= 0 && index < selectedIndex;
                      const current = index === selectedIndex;
                      return (
                        <div key={stage} className={`flex items-start gap-3 rounded-2xl border p-3 ${current ? 'border-amber-200 bg-amber-50' : done ? 'border-brand-100 bg-brand-50/60' : 'border-gray-100 bg-gray-50/60'}`}>
                          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${current ? 'bg-white text-amber-600' : done ? 'bg-white text-brand-600' : 'bg-white text-slate-400'}`}>
                            {done ? <CheckCircle2 size={17} /> : current ? <Clock3 size={17} /> : <Circle size={17} />}
                          </div>
                          <div><p className={`text-sm font-bold ${current ? 'text-amber-900' : done ? 'text-brand-800' : 'text-ink-700'}`}>{STAGE_LABELS[stage]}</p><p className="text-[11px] leading-4 text-ink-500">{STAGE_DESCRIPTIONS[stage]}</p></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start gap-2"><CalendarDays size={16} className="mt-0.5 text-brand-600" /><div><p className="text-xs font-bold uppercase tracking-wide text-ink-600">Location & field</p><p className="mt-1 text-sm font-semibold text-ink-900">{selected.location}</p><p className="mt-0.5 text-xs text-ink-500">{selected.farmName} · {selected.fieldName} · {selected.area.toFixed(1)} acres</p></div></div>
                </div>
              </GlassCard>
            )}
          </div>

          <GlassCard padding="lg" className="border-amber-100 bg-amber-50/60">
            <div className="flex items-start gap-3"><AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-600" /><p className="text-xs leading-5 text-amber-800">Each crop cycle is shown from its field/crop record. The page does not use the single farmer-level current crop as the source for the multi-field list. Where a duration rule is unavailable, it shows the saved stage without inventing a timeline duration.</p></div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
