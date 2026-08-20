import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase, supabaseMisconfigured } from '@/lib/supabase';

export type RealtimeStatus = 'DISABLED' | 'CONNECTING' | 'SUBSCRIBED' | 'ERROR' | 'CLOSED';

export interface RealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onStatus?: (_status: RealtimeStatus, error?: Error) => void;
}

export interface RealtimeHandle {
  unsubscribe: () => Promise<void>;
}

export function subscribeToTable(options: RealtimeSubscriptionOptions): RealtimeHandle {
  if (supabaseMisconfigured) {
    options.onStatus?.('DISABLED');
    return { unsubscribe: async () => undefined };
  }

  let channel: RealtimeChannel | null = null;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  const onlineHandler = () => {
    if (stopped) return;
    reconnectAttempt = 0;
    if (channel) void supabase.removeChannel(channel).finally(() => { channel = null; connect(); });
    else connect();
  };
  const offlineHandler = () => options.onStatus?.('CLOSED');

  const connect = () => {
    if (stopped) return;
    options.onStatus?.('CONNECTING');

    channel = supabase
      .channel(`realtime:${options.table}:${options.filter ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
          ...(options.filter ? { filter: options.filter } : {}),
        },
        (_payload) => {
          reconnectAttempt = 0;
          options.onStatus?.('SUBSCRIBED');
          options.onChange(_payload);
        },
      )
      .subscribe((_status, error) => {
        if (stopped) return;

        if (_status === 'SUBSCRIBED') {
          reconnectAttempt = 0;
          options.onStatus?.('SUBSCRIBED');
          return;
        }

        if (_status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          options.onStatus?.('ERROR', error instanceof Error ? error : new Error(String(error ?? status)));
          const delay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
          reconnectAttempt += 1;
          reconnectTimer = setTimeout(connect, delay);
        }

        if (_status === 'CLOSED') {
          options.onStatus?.('CLOSED');
        }
      });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
  }
  connect();

  return {
    unsubscribe: async () => {
      stopped = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) await supabase.removeChannel(channel);
      options.onStatus?.('CLOSED');
    },
  };
}
