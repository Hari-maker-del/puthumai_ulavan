import apiClient, { setToken } from '@/services/apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/services/types';

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  setToken(data.token);
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  setToken(data.token);
  return data;
}
