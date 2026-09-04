import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFarms } from '@/hooks/useFarms';
import { supabase } from '@/lib/supabase';

type HealthRow = { health?: unknown };

const healthColor = (h: number) =>
  h >= 85 ? '#16a34a' : h >= 75 ? '#d97706' : '#ef4444';

export default function CropHealthScore() {
  const { user } = useAuth();
  const { data: farms, loading: farmsLoading } = useFarms(user?.id);
  const [cropHealth, setCropHealth] = useState<number[]>([]);
  const [cropLoading, setCropLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setCropHealth([]);
      return;
    }

    setCropLoading(true);
    void supabase
      .from('crops')
      .select('health')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!active) return;
        setCropHealth(
          ((data ?? []) as HealthRow[])
            .map((row) => Number(row.health))
            .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100),
        );
      })
      .finally(() => {
        if (active) setCropLoading(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  const healthValues = useMemo(() => {
    const cropValues = cropHealth.length ? cropHealth : [];
    if (cropValues.length) return cropValues;
    return (Array.isArray(farms) ? farms : [])
      .map((farm) => Number(farm.health))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  }, [cropHealth, farms]);

  const score = healthValues.length
    ? Math.round(healthValues.reduce((sum, value) => sum + value, 0) / healthValues.length)
    : 0;
  const radius = 48;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = healthColor(score);

  const healthy = healthValues.filter((h) => h >= 85).length;
  const watch = healthValues.filter((h) => h >= 75 && h < 85).length;
  const risk = healthValues.filter((h) => h < 75).length;
  const loading = farmsLoading || cropLoading;

  return (
    <div className="bg-white rounded-xl shadow-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Crop Health</div>
        <div className="h-9 w-9 rounded-lg bg-green-50 grid place-items-center">
          <HeartPulse size={16} className="text-green-600" />
        </div>
      </div>

      <div className="flex items-center justify-center my-2">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="9" />
            <circle cx="55" cy="55" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              {loading ? <Loader2 size={24} className="animate-spin text-brand-600 mx-auto" /> : <div className="font-display font-extrabold text-3xl text-ink-900 leading-none">{score}</div>}
              <div className="text-[10px] text-ink-500 mt-0.5">/ 100</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-2">
        {[
          { label: 'Healthy', value: healthy, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Watch', value: watch, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'At Risk', value: risk, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((item) => (
          <div key={item.label} className={`rounded-lg ${item.bg} py-2.5`}>
            <div className={`font-display font-bold text-xl ${item.color}`}>{item.value}</div>
            <div className="text-[10px] font-semibold text-ink-500 uppercase">{item.label}</div>
          </div>
        ))}
      </div>

      {!loading && !healthValues.length && (
        <p className="mt-3 text-[11px] text-ink-500 text-center">No crop-health records available yet.</p>
      )}

      <Link to="/dashboard/crop-health" className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-ink-700 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors">
        View Details <ArrowRight size={12} />
      </Link>
    </div>
  );
}
