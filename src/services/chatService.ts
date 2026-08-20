import apiClient from '@/services/apiClient';
import type { ChatRequest, ChatResponse } from '@/services/types';

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/chat', payload);
  return data;
}
