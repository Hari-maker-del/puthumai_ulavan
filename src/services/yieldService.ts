import apiClient from '@/services/apiClient';
import type { YieldRequest, YieldResponse } from '@/services/types';

export async function predictYield(payload: YieldRequest): Promise<YieldResponse> {
  const { data } = await apiClient.post<YieldResponse>('/yield', payload);
  return data;
}
