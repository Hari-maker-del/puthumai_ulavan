import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase, supabaseMisconfigured } from '@/lib/supabase';

export type RealtimeStatus =
  | 'DISABLED'
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'RECONNECTING'
  | 'ERROR'
  | 'CLOSED';

export interface RealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  onChange: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void;
  onStatus?: (status: RealtimeStatus, error?: Error) => void;
}

export interface RealtimeHandle {
  unsubscribe: () => Promise<void>;
}

let channelCounter = 0;

export function subscribeToTable(
  options: RealtimeSubscriptionOptions,
): RealtimeHandle {
  if (supabaseMisconfigured) {
    options.onStatus?.('DISABLED');
    return {
      unsubscribe: async () => undefined,
    };
  }

  let channel: RealtimeChannel | null = null;
  let stopped = false;
  let connecting = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;

  const subscriptionId = ++channelCounter;

  const createChannelName = () =>
    `realtime:${options.table}:${options.filter ?? 'all'}:${subscriptionId}:${Date.now()}`;

  const cleanupChannel = async () => {
    const currentChannel = channel;

    channel = null;
    connecting = false;

    if (!currentChannel) return;

    try {
      await supabase.removeChannel(currentChannel);
    } catch {
      // Ignore cleanup errors.
    }
  };

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;

    const delay = Math.min(
      1000 * 2 ** reconnectAttempt,
      30000,
    );

    reconnectAttempt += 1;

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;

      if (stopped) return;

      await cleanupChannel();

      if (!stopped) {
        connect();
      }
    }, delay);
  };

  const connect = () => {
    if (stopped || connecting || channel) return;

    connecting = true;

    options.onStatus?.(
      reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING',
    );

    const newChannel = supabase.channel(createChannelName());

    channel = newChannel;

    newChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
          ...(options.filter
            ? { filter: options.filter }
            : {}),
        },
        (payload) => {
          if (stopped || channel !== newChannel) return;

          reconnectAttempt = 0;
          options.onStatus?.('SUBSCRIBED');
          options.onChange(
            payload as RealtimePostgresChangesPayload<
              Record<string, unknown>
            >,
          );
        },
      )
      .subscribe(async (status, error) => {
        if (stopped || channel !== newChannel) return;

        if (status === 'SUBSCRIBED') {
          connecting = false;
          reconnectAttempt = 0;
          options.onStatus?.('SUBSCRIBED');
          return;
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          connecting = false;

          const err =
            error instanceof Error
              ? error
              : new Error(
                  String(error ?? status),
                );

          options.onStatus?.('ERROR', err);

          await cleanupChannel();

          if (!stopped) {
            scheduleReconnect();
          }

          return;
        }

        if (status === 'CLOSED') {
          connecting = false;

          await cleanupChannel();

          if (!stopped) {
            options.onStatus?.('CLOSED');
            scheduleReconnect();
          }
        }
      });
  };

  const onlineHandler = () => {
    if (stopped) return;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    reconnectAttempt = 0;

    void cleanupChannel().then(() => {
      if (!stopped) {
        connect();
      }
    });
  };

  const offlineHandler = () => {
    options.onStatus?.('CLOSED');
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
        window.removeEventListener(
          'online',
          onlineHandler,
        );
        window.removeEventListener(
          'offline',
          offlineHandler,
        );
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      await cleanupChannel();

      options.onStatus?.('CLOSED');
    },
  };
}