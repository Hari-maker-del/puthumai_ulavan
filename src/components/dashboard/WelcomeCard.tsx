import { CalendarDays, MapPin, Sprout, BellRing, ArrowUpRight } from 'lucide-react';
import { useFarms } from '@/hooks/useFarms';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getAlerts } from '@/services/farmerAlertsService';
import { supabase } from '@/lib/supabase';

export default function WelcomeCard() {
  const { profile, user } = useAuth();
  useFarms(user?.id);
  const [fieldCount, setFieldCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Farmer';
  const firstName = displayName.split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const location = profile?.village
    ? `${profile.village}, ${profile?.state ?? 'India'}`
    : 'Add your farm location';

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    void getAlerts(user.id)
      .then((alerts) => { if (active) setAlertCount(alerts.filter((alert) => !alert.is_read).length); })
      .catch(() => { if (active) setAlertCount(0); });
    void supabase.from('fields').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => { if (active) setFieldCount(count ?? 0); });
    return () => { active = false; };
  }, [user?.id]);

  return (
    <section className="relative isolate overflow-hidden rounded-[1.6rem] bg-[#173F2B] p-5 text-white shadow-[0_18px_45px_rgba(24,63,43,0.14)] sm:p-7 lg:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-16 h-48 w-48 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[24%] h-32 w-32 rounded-full bg-[#C6DFA0]/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D6EAAE] backdrop-blur">
            <Sprout className="h-3.5 w-3.5" /> Your farm workspace
          </div>
          <p className="mt-5 text-sm font-medium text-white/65">{greeting} 🌿</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {firstName}<span className="text-[#C6DFA0]">.</span>
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-[#C6DFA0]" />{today}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-[#C6DFA0]" />{location}</span>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:min-w-[250px]">
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C6DFA0]/15 text-[#D6EAAE]"><Sprout size={17} /></span>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{fieldCount}</p>
            <p className="mt-1 text-[11px] font-medium text-white/65">Fields registered</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F2D48C]/15 text-[#F2D48C]"><BellRing size={17} /></span>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{alertCount}</p>
            <p className="mt-1 text-[11px] font-medium text-white/65">Unread alerts</p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-3 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-sm leading-6 text-white/75">A clearer view of your crops, field work and farm records starts here.</p>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-[#D6EAAE]">Make today count <ArrowUpRight size={14} /></span>
      </div>
    </section>
  );
}
