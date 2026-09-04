import { useEffect, useRef, useState } from 'react';
import { subscribeToTable, type RealtimeStatus } from '@/services/realtimeService';

export function useRealtimeTable(
  table: string,
  filter: string | undefined,
  onChange: () => void,
) {
  const [status, setStatus] = useState<RealtimeStatus>('DISABLED');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!table) return;
    const subscription = subscribeToTable({
      table,
      filter,
      onChange: () => onChangeRef.current(),
      onStatus: setStatus,
    });
    return () => { void subscription.unsubscribe(); };
  }, [table, filter]);

  return {
    status,
    isLive: status === 'SUBSCRIBED',
  };
}
