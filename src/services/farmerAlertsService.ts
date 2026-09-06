/** Smart farming alerts backed by the authenticated farmer_alerts table. */
import { supabase } from '@/lib/supabase';
import type { FarmerMemory } from './farmerMemoryService';

export interface FarmerAlert {
  id: string; user_id: string; title: string; detail?: string | null;
  alert_type: 'weather' | 'crop' | 'irrigation' | 'scheme' | 'reminder' | 'health' | 'ai';
  severity: 'info' | 'warning' | 'critical'; is_read: boolean; is_live: boolean; created_at: string;
}

export async function getAlerts(userId: string): Promise<FarmerAlert[]> {
  const { data, error } = await supabase.from('farmer_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (error) { console.error('getAlerts:', error.message); return []; }
  return (data ?? []) as FarmerAlert[];
}

export async function markAlertRead(alertId: string, userId?: string): Promise<void> {
  let query = supabase.from('farmer_alerts').update({ is_read: true }).eq('id', alertId);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) console.error('markAlertRead:', error.message);
}

export async function createAlert(userId: string, alert: Omit<FarmerAlert,'id'|'user_id'|'created_at'|'is_read'>): Promise<void> {
  const { error } = await supabase.from('farmer_alerts').insert({ user_id:userId, is_read:false, ...alert });
  if (error) console.error('createAlert:', error.message);
}

export function generateSmartReminders(memory: FarmerMemory | null): Omit<FarmerAlert,'id'|'user_id'|'created_at'|'is_read'>[] {
  if (!memory) return [];
  const reminders: Omit<FarmerAlert,'id'|'user_id'|'created_at'|'is_read'>[] = [];
  const crop = memory.current_crop;
  const stage = memory.crop_stage?.toLowerCase();
  if (crop && stage) {
    if (stage === 'sowing') reminders.push({title:`${crop} – Sowing Stage Tips`,detail:'Ensure proper seed treatment and correct seed rate. Verify soil moisture before sowing.',alert_type:'crop',severity:'info',is_live:false});
    if (stage === 'vegetative') { reminders.push({title:`${crop} – Vegetative Stage`,detail:'Check for pest incidence. Follow the recommended nutrient schedule for your crop.',alert_type:'crop',severity:'info',is_live:false}); reminders.push({title:'Irrigation Reminder',detail:`Maintain adequate soil moisture for ${crop} in vegetative stage.`,alert_type:'irrigation',severity:'info',is_live:false}); }
    if (stage === 'flowering') reminders.push({title:`${crop} – Critical Flowering Stage`,detail:'Avoid moisture stress and monitor the crop closely for pests and disease symptoms.',alert_type:'crop',severity:'warning',is_live:false});
    if (stage === 'harvesting') reminders.push({title:`${crop} – Harvest Approaching`,detail:'Plan labour and transport and check crop readiness before harvesting.',alert_type:'crop',severity:'info',is_live:false});
  }
  if (memory.irrigation_method === 'drip') reminders.push({title:'Drip System Check',detail:'Inspect drip laterals and emitters for blockages and flush the system regularly.',alert_type:'irrigation',severity:'info',is_live:false});
  if (!memory.soil_type) reminders.push({title:'Soil Health Card',detail:'Consider obtaining a Soil Health Card for soil nutrient analysis.',alert_type:'scheme',severity:'info',is_live:false});
  if (!memory.current_crop) reminders.push({title:'Complete Your Farm Profile',detail:'Add your current crop details to receive more personalised farm guidance.',alert_type:'ai',severity:'info',is_live:false});
  return reminders;
}
