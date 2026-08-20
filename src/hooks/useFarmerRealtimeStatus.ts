import { useEffect, useState } from 'react';
import { subscribeRealtime, type RealtimeStatus } from '@/services/realtimeManager';
import { FARMER_REALTIME_TABLES } from '@/services/farmerRealtimeRegistry';

export function useFarmerRealtimeStatus(userId?: string) {
  const [statuses, setStatuses] = useState<Record<string, RealtimeStatus>>({});

  useEffect(() => {
    if (!userId) {
      setStatuses({});
      return;
    }

    const subscriptions = FARMER_REALTIME_TABLES.map(table =>
      subscribeRealtime(
        table,
        table === 'farms' ? `owner_id=eq.${userId}` : `user_id=eq.${userId}`,
        () => undefined,
        status => setStatuses(current => ({ ...current, [table]: status })),
      )
    );

    return () => { subscriptions.forEach(subscription => void subscription.unsubscribe()); };
  }, [userId]);

  const values = Object.values(statuses);
  return {
    statuses,
    live: values.length > 0 && values.every(status => status === 'SUBSCRIBED'),
    reconnecting: values.some(status => status === 'RECONNECTING' || status === 'CONNECTING'),
  };
}
