import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getDashboard } from '@/services/dashboardService';
import type { DashboardResponse } from '@/services/types';

export function useDashboard() {
  const { user } = useAuth();
  return useApiQuery<DashboardResponse>(() => getDashboard(user?.id ?? ''), Boolean(user?.id));
}
