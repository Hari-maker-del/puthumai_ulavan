import { useEffect, useRef, useState } from 'react';
import { subscribeToTable } from '@/services/realtimeService';

const TABLES = [
  {
    table: 'farms',
    filter: (userId: string) => `user_id=eq.${userId}`,
  },
  {
    table: 'expenses',
    filter: (userId: string) => `user_id=eq.${userId}`,
  },
  {
    table: 'crops',
    filter: (userId: string) => `user_id=eq.${userId}`,
  },
  {
    table: 'farmer_alerts',
    filter: (userId: string) => `user_id=eq.${userId}`,
  },
  {
    table: 'recommendations',
    filter: (userId: string) => `user_id=eq.${userId}`,
  },
  {
    table: 'market_prices',
    filter: () => undefined,
  },
] as const;

export function useRealtimeDashboard(userId?: string | null) {
  const [refreshKey, setRefreshKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const scheduleRefresh = () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(() => {
        setRefreshKey(key => key + 1);
      }, 150);
    };

    const subscriptions = TABLES.map(({ table, filter }) =>
      subscribeToTable({
        table,
        filter: filter(userId),
        onChange: scheduleRefresh,
      }),
    );

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      subscriptions.forEach(subscription => {
        void subscription.unsubscribe();
      });
    };
  }, [userId]);

  return refreshKey;
}