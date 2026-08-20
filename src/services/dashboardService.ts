import apiClient from '@/services/apiClient';
import type { DashboardResponse } from '@/services/types';

export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>('/dashboard');
  return data;
}
