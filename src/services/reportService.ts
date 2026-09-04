import apiClient from '@/services/apiClient';
import type { ReportResponse } from '@/services/types';

export async function getReport(): Promise<ReportResponse> {
  const { data } = await apiClient.get<ReportResponse>('/report');
  return data;
}
