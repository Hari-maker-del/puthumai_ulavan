import { supabase, supabaseMisconfigured } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeStatus =
  | 'DISABLED'
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'RECONNECTING'
  | 'ERROR'
  | 'CLOSED';

export interface RealtimeEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  receivedAt: string;
}

export interface RealtimeSubscription {
  unsubscribe: () => Promise<void>;
}

export function subscribeRealtime(
  table: string,
  filter: string | undefined,
  onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  onStatus?: (_status: RealtimeStatus, error?: Error) => void,
): RealtimeSubscription {
  if (supabaseMisconfigured) {
    onStatus?.('DISABLED');
    return { unsubscribe: async () => undefined };
  }

  let stopped = false;
  let channel: RealtimeChannel | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;

  const connect = () => {
    if (stopped) return;

    onStatus?.(attempts ? 'RECONNECTING' : 'CONNECTING');

    channel = supabase
      .channel(`pu:${table}:${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        payload => {
          attempts = 0;
          onStatus?.('SUBSCRIBED');
          onEvent(_payload);
        },
      )
      .subscribe((_status, error) => {
        if (stopped) return;

        if (_status === 'SUBSCRIBED') {
          attempts = 0;
          onStatus?.('SUBSCRIBED');
          return;
        }

        if (_status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const err = error instanceof Error ? error : new Error(String(error ?? status));
          onStatus?.('ERROR', err);
          const delay = Math.min(1000 * (2 ** attempts), 30000);
          attempts += 1;
          reconnectTimer = setTimeout(connect, delay);
        }

        if (_status === 'CLOSED') onStatus?.('CLOSED');
      });
  };

  connect();

  return {
    unsubscribe: async () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) await supabase.removeChannel(channel);
      onStatus?.('CLOSED');
    },
  };
}
