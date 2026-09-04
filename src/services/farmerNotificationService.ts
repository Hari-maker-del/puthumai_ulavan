export type FarmerNotificationType =
  | 'WEATHER'
  | 'CROP'
  | 'EXPENSE'
  | 'RECOMMENDATION'
  | 'SYSTEM';

export interface FarmerNotification {
  id: string;
  type: FarmerNotificationType;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  read: boolean;
  source: 'SUPABASE' | 'WEATHER' | 'AI' | 'SYSTEM';
}

export function sortNotifications(items: FarmerNotification[]): FarmerNotification[] {
  return [...items].sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
