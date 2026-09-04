import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Circle, Sprout, Loader2, AlertCircle } from 'lucide-react';
import { CROP_STAGE_LABELS, type LifecycleEvent, buildCropTimeline } from '../../services/cropLifecycleService';
import { calculateCropLifecycle } from '../../services/cropLifecycleEngine';
import { getFarmerMemory } from '../../services/farmerMemoryService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';

function buildEventsFromMemory(
  crop: string | undefined,
  cropStage: string | undefined,
  plantingDate: string | undefined,
  expectedHarvest: string | undefined,
): LifecycleEvent[] {
  const lifecycle = calculateCropLifecycle(crop, plantingDate);
  const allStages = ['sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'harvest'];

  // Find the current stage index based on farmer-reported stage or engine calculation
  const reportedStage = cropStage?.toLowerCase() ?? '';
  const engineStage = lifecycle.stage?.toLowerCase() ?? '';
  const matchStage = reportedStage || engineStage;

  const currentIdx = allStages.findIndex(
    (s) => matchStage.includes(s) || s.includes(matchStage.split(' ')[0]),
  );
  const resolvedCurrentIdx = currentIdx >= 0 ? currentIdx : (lifecycle.progress != null ? Math.round((lifecycle.progress / 100) * (allStages.length - 1)) : 0);

  return allStages.map((stage, i): LifecycleEvent => {
    const status: LifecycleEvent['status'] =
      i < resolvedCurrentIdx ? 'completed' : i === resolvedCurrentIdx ? 'current' : 'upcoming';

    let note: string | undefined;
    if (stage === 'sowing' && plantingDate) note = `Planted: ${new Date(plantingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (stage === 'harvest' && expectedHarvest) note = `Expected: ${new Date(expectedHarvest).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (stage === engineStage && lifecycle.day != null) note = (note ? note + ' · ' : '') + `Day ${lifecycle.day} of ${lifecycle.expectedDuration ?? '?'}`;

    return {
      id: stage,
      title: CROP_STAGE_LABELS[stage] ?? stage,
      stage,
      status,
      note,
    };
  });
}

export default function CropLifecyclePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [crop, setCrop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getFarmerMemory(user.id)
      .then((memory) => {
        if (!memory?.current_crop) {
          setError('No crop found in your Farmer Memory. Add your current crop in the Farmer Memory page.');
          setEvents([]);
          return;
        }
        setCrop(memory.current_crop);
        const built = buildCropTimeline(
          buildEventsFromMemory(
            memory.current_crop,
            memory.crop_stage ?? undefined,
            memory.planting_date ?? undefined,
            memory.expected_harvest ?? undefined,
          ),
        );
        setEvents(built);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load crop data.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Sprout} title="Crop Lifecycle" subtitle="Track your crop's journey from sowing to harvest." />

      {loading && (
        <GlassCard padding="lg" className="grid place-items-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
          <div className="mt-3 text-sm text-ink-600">Loading crop timeline…</div>
        </GlassCard>
      )}

      {!loading && error && (
        <GlassCard padding="lg" className="flex items-start gap-3 bg-amber-50 border border-amber-100">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">{error}</div>
        </GlassCard>
      )}

      {!loading && !error && events.length > 0 && (
        <GlassCard padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-brand-50 p-3"><Sprout className="text-brand-600" /></div>
            <div>
              <h2 className="font-display font-bold text-ink-900">{crop} — Season Timeline</h2>
              <p className="text-sm text-ink-600">Based on your Farmer Memory records. Update your crop stage there for more precision.</p>
            </div>
          </div>

          <div className="space-y-5">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {event.status === 'completed'
                    ? <CheckCircle2 size={22} className="text-brand-600" />
                    : event.status === 'current'
                    ? <Calendar size={22} className="text-amber-500" />
                    : <Circle size={22} className="text-slate-300" />}
                  {index < events.length - 1 && <div className="mt-1 h-8 w-px bg-slate-200" />}
                </div>
                <div className="pb-2">
                  <div className={`font-semibold ${event.status === 'current' ? 'text-amber-700' : event.status === 'completed' ? 'text-brand-700' : 'text-ink-600'}`}>
                    {event.title}
                    {event.status === 'current' && <span className="ml-2 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">Current</span>}
                  </div>
                  <p className="text-sm text-ink-600">{CROP_STAGE_LABELS[event.stage] ?? event.stage}</p>
                  {event.note && <p className="mt-1 text-xs text-ink-500">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
