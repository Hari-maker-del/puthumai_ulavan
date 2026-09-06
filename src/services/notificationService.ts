import { supabase } from '@/lib/supabase';

export type FarmNotificationType = 'weather' | 'crop' | 'market' | 'expense' | 'scheme' | 'task' | 'health' | 'irrigation' | 'reminder' | 'ai';

export interface FarmNotification { id: string; userId?: string; type: FarmNotificationType; title: string; message: string; createdAt: string; read: boolean; isLive?: boolean; severity?: 'info' | 'warning' | 'critical'; }

const KEY = 'puthumai-uzhavan:notifications';
const normalizeType = (value: string): FarmNotificationType => {
  const allowed: FarmNotificationType[] = ['weather','crop','market','expense','scheme','task','health','irrigation','reminder','ai'];
  return allowed.includes(value as FarmNotificationType) ? value as FarmNotificationType : 'ai';
};

export async function loadNotifications(userId?: string): Promise<FarmNotification[]> {
  if (userId) {
    const { data, error } = await supabase.from('farmer_alerts').select('id,user_id,title,detail,alert_type,severity,is_read,is_live,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
    if (!error) return (data ?? []).map(item => ({ id:item.id, userId:item.user_id, type:normalizeType(item.alert_type), title:item.title, message:item.detail ?? '', createdAt:item.created_at, read:Boolean(item.is_read), isLive:Boolean(item.is_live), severity:item.severity }));
  }
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as FarmNotification[]; } catch { return []; }
}

export function saveNotifications(items: FarmNotification[]): void { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }

export async function markNotificationRead(id: string, userId?: string): Promise<void> {
  if (userId) { const { error } = await supabase.from('farmer_alerts').update({ is_read:true }).eq('id',id).eq('user_id',userId); if (!error) return; }
  const items = await loadNotifications(); saveNotifications(items.map(item => item.id === id ? {...item, read:true} : item));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('farmer_alerts').update({is_read:true}).eq('user_id',userId).eq('is_read',false);
  if (!error) return;
  const items = await loadNotifications(); saveNotifications(items.map(item => ({...item,read:true})));
}

export async function clearNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('farmer_alerts').delete().eq('user_id',userId);
  if (!error) return;
  saveNotifications([]);
}

export async function addNotification(notification: Omit<FarmNotification,'id'|'createdAt'|'read'>): Promise<FarmNotification> {
  if (notification.userId) {
    const { data, error } = await supabase.from('farmer_alerts').insert({ user_id:notification.userId, title:notification.title, detail:notification.message, alert_type:notification.type === 'task' ? 'reminder' : notification.type, severity:notification.severity ?? 'info', is_read:false, is_live:notification.isLive ?? false }).select('id,user_id,title,detail,alert_type,severity,is_read,is_live,created_at').single();
    if (!error && data) return {id:data.id,userId:data.user_id,type:normalizeType(data.alert_type),title:data.title,message:data.detail ?? '',createdAt:data.created_at,read:Boolean(data.is_read),isLive:Boolean(data.is_live),severity:data.severity};
  }
  const item: FarmNotification = {...notification,id:crypto.randomUUID(),createdAt:new Date().toISOString(),read:false};
  saveNotifications([item,...(await loadNotifications())].slice(0,100)); return item;
}
