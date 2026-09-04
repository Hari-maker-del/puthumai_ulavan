import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import {
  supabase,
  supabaseMisconfigured,
} from '@/lib/supabase';

export type RealtimeStatus =
  | 'DISABLED'
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'RECONNECTING'
  | 'ERROR'
  | 'CLOSED';

export interface RealtimeSubscription {
  unsubscribe: () => Promise<void>;
}

let channelCounter = 0;

export function subscribeRealtime(
  table: string,
  filter: string | undefined,
  onEvent: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onStatus?: (
    status: RealtimeStatus,
    error?: Error
  ) => void,
): RealtimeSubscription {

  if (supabaseMisconfigured) {
    onStatus?.('DISABLED');

    return {
      unsubscribe: async () => undefined,
    };
  }

  let stopped = false;
  let channel: RealtimeChannel | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;

  /*
   * IMPORTANT:
   * Every subscription gets a UNIQUE channel name.
   *
   * This prevents collisions when multiple React hooks
   * subscribe to the same table/filter.
   */
  const channelId = ++channelCounter;

  const createChannelName = () =>
    `pu-realtime-${table}-${channelId}-${Date.now()}`;

  const connect = () => {
    if (stopped) return;

    onStatus?.(
      reconnectAttempt > 0
        ? 'RECONNECTING'
        : 'CONNECTING'
    );

    const channelName = createChannelName();

    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        payload => {
          if (stopped) return;

          reconnectAttempt = 0;
          onStatus?.('SUBSCRIBED');

          onEvent(
            payload as RealtimePostgresChangesPayload<
              Record<string, unknown>
            >
          );
        },
      )
      .subscribe((status, error) => {

        if (stopped) return;

        if (status === 'SUBSCRIBED') {
          reconnectAttempt = 0;
          onStatus?.('SUBSCRIBED');
          return;
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          const err =
            error instanceof Error
              ? error
              : new Error(
                  String(error ?? status)
                );

          onStatus?.('ERROR', err);

          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }

          const delay = Math.min(
            1000 * 2 ** reconnectAttempt,
            30000
          );

          reconnectAttempt += 1;

          reconnectTimer = setTimeout(async () => {
            if (stopped) return;

            if (channel) {
              const oldChannel = channel;
              channel = null;

              try {
                await supabase.removeChannel(
                  oldChannel
                );
              } catch {
                // Ignore cleanup errors.
              }
            }

            connect();
          }, delay);

          return;
        }

        if (status === 'CLOSED') {
          onStatus?.('CLOSED');
        }
      });
  };

  connect();

  return {
    unsubscribe: async () => {
      stopped = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (channel) {
        const currentChannel = channel;
        channel = null;

        await supabase.removeChannel(
          currentChannel
        );
      }

      onStatus?.('CLOSED');
    },
  };
}