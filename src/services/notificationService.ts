export type FarmNotificationType =
  | 'weather'
  | 'crop'
  | 'market'
  | 'expense'
  | 'scheme'
  | 'task'
  | 'health';

export interface FarmNotification {
  id: string;
  type: FarmNotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const KEY = 'puthumai-uzhavan:notifications';

export function loadNotifications(): FarmNotification[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as FarmNotification[];
  } catch {
    return [];
  }
}

export function saveNotifications(items: FarmNotification[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* intentional: storage errors must not crash */ }
}

export function addNotification(
  notification: Omit<FarmNotification, 'id' | 'createdAt' | 'read'>,
): FarmNotification {
  const item: FarmNotification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  saveNotifications([item, ...loadNotifications()].slice(0, 100));
  return item;
}
