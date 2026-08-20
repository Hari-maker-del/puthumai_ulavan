import React from 'react';
import { Calendar, CheckCircle2, Circle, Sprout } from 'lucide-react';
import { CROP_STAGE_LABELS, LifecycleEvent, buildCropTimeline } from '../../services/cropLifecycleService';

const demoEvents: LifecycleEvent[] = [
  { id: '1', title: 'Land preparation', stage: 'land-preparation', status: 'completed', note: 'Record the actual preparation date in Farm Profile.' },
  { id: '2', title: 'Sowing', stage: 'sowing', status: 'completed', note: 'Use your farm record as the source of truth.' },
  { id: '3', title: 'Current crop stage', stage: 'vegetative', status: 'current', note: 'Update this stage in Farmer Memory for more precise AI plans.' },
  { id: '4', title: 'Flowering', stage: 'flowering', status: 'upcoming' },
  { id: '5', title: 'Harvest', stage: 'harvest', status: 'upcoming' },
];

export default function CropLifecyclePage() {
  const events = buildCropTimeline(demoEvents);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600">Farm journey</p>
        <h1 className="text-3xl font-bold">Crop Lifecycle</h1>
        <p className="mt-1 text-sm text-slate-600">Track the crop journey from preparation to post-harvest.</p>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-emerald-50 p-3"><Sprout className="text-emerald-600" /></div>
          <div><h2 className="font-semibold">Season timeline</h2><p className="text-sm text-slate-500">Update dates and crop stage from your farm profile.</p></div>
        </div>
        <div className="space-y-5">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                {event.status === 'completed' ? <CheckCircle2 className="text-emerald-600" /> : event.status === 'current' ? <Calendar className="text-amber-600" /> : <Circle className="text-slate-300" />}
                {index < events.length - 1 && <div className="mt-1 h-8 w-px bg-slate-200" />}
              </div>
              <div className="pb-2">
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-slate-500">{CROP_STAGE_LABELS[event.stage]}</p>
                {event.note && <p className="mt-1 text-sm text-slate-600">{event.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
