import { supabase, supabaseMisconfigured } from '@/lib/supabase';

export async function checkRealtimeHealth(): Promise<{
  ok: boolean;
  configured: boolean;
  detail: string;
}> {
  if (supabaseMisconfigured) {
    return { ok: false, configured: false, detail: 'Supabase is not configured.' };
  }

  try {
    const channel = supabase.channel(`health:${Date.now()}`);
    const result = await new Promise<'ok' | 'error'>(resolve => {
      const timer = setTimeout(() => resolve('error'), 8000);
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          resolve('ok');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timer);
          resolve('error');
        }
      });
    });
    await supabase.removeChannel(channel);

    return result === 'ok'
      ? { ok: true, configured: true, detail: 'Realtime channel subscribed successfully.' }
      : { ok: false, configured: true, detail: 'Realtime channel could not be established.' };
  } catch {
    return { ok: false, configured: true, detail: 'Realtime health check failed.' };
  }
}
