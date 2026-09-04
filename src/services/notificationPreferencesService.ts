import {supabase,supabaseMisconfigured} from '@/lib/supabase';
export type NotificationPreferences={weather:boolean;crop:boolean;expense:boolean;market:boolean;schemes:boolean};
export const DEFAULT_NOTIFICATION_PREFERENCES:NotificationPreferences={weather:true,crop:true,expense:true,market:true,schemes:true};
export async function loadNotificationPreferences(userId:string){if(supabaseMisconfigured)throw new Error('Notifications are not configured.');const {data,error}=await supabase.from('notification_preferences').select('*').eq('user_id',userId).maybeSingle();if(error)throw error;return {...DEFAULT_NOTIFICATION_PREFERENCES,...(data??{})}}
export async function saveNotificationPreferences(userId:string,prefs:NotificationPreferences){if(supabaseMisconfigured)throw new Error('Notifications are not configured.');const {error}=await supabase.from('notification_preferences').upsert({user_id:userId,...prefs});if(error)throw error}
