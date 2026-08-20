import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeRealtime, type RealtimeStatus } from '@/services/realtimeManager';

export function useRealtimeSync(
  table: string,
  filter: string | undefined,
  refresh: () => Promise<unknown> | unknown,
) {
  const [status, setStatus] = useState<RealtimeStatus>('DISABLED');
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const resync = useCallback(() => {
    void refreshRef.current();
  }, []);

  useEffect(() => {
    if (!filter) {
      setStatus('DISABLED');
      return;
    }

    const subscription = subscribeRealtime(
      table,
      filter,
      () => resync(),
      next => setStatus(next),
    );

    return () => {
      void subscription.unsubscribe();
    };
  }, [table, filter, resync]);

  return {
    status,
    isLive: status === 'SUBSCRIBED',
    resync,
  };
}
