/** Smart farming alerts backed by the authenticated farmer_alerts table. */
import { supabase } from '@/lib/supabase';
import type { WeatherData } from '@/services/types';
import type { FarmerMemory } from './farmerMemoryService';

export interface FarmerAlert {
  id: string; user_id: string; title: string; detail?: string | null;
  alert_type: 'weather' | 'crop' | 'irrigation' | 'scheme' | 'reminder' | 'health' | 'ai';
  severity: 'info' | 'warning' | 'critical'; is_read: boolean; is_live: boolean; created_at: string;
}

type NewAlert = Omit<FarmerAlert,'id'|'user_id'|'created_at'|'is_read'>;

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

export async function createAlert(userId: string, alert: NewAlert): Promise<void> {
  const { error } = await supabase.from('farmer_alerts').insert({ user_id:userId, is_read:false, ...alert });
  if (error) console.error('createAlert:', error.message);
}

export function generateSmartReminders(memory: FarmerMemory | null): NewAlert[] {
  if (!memory) return [];
  const reminders: NewAlert[] = [];
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

export function generateWeatherAlerts(weather: WeatherData | null, memory: FarmerMemory | null): NewAlert[] {
  if (!weather) return [];
  const alerts: NewAlert[] = [];
  const crop = memory?.current_crop ? ` for ${memory.current_crop}` : '';
  const location = weather.location ? ` in ${weather.location}` : '';
  const rain = Number(weather.today.rainProbability);
  const temp = Number(weather.today.temp);
  const wind = Number(weather.today.wind);

  if (Number.isFinite(rain) && rain >= 70) alerts.push({title:'High Rain Probability',detail:`${Math.round(rain)}% chance of rain${location}. Consider postponing spraying and unnecessary field work${crop}; check drainage before heavy rain.`,alert_type:'weather',severity:rain >= 85?'critical':'warning',is_live:true});
  if (Number.isFinite(temp) && temp >= 35) alerts.push({title:'Heat Stress Risk',detail:`Current temperature is about ${Math.round(temp)}°C${location}. Check crop moisture and avoid strenuous field work during peak heat${crop}.`,alert_type:'weather',severity:temp >= 38?'critical':'warning',is_live:true});
  if (Number.isFinite(wind) && wind >= 35) alerts.push({title:'Strong Wind Advisory',detail:`Wind is about ${Math.round(wind)} km/h${location}. Avoid spraying in strong wind and inspect vulnerable plants or structures${crop}.`,alert_type:'weather',severity:wind >= 50?'critical':'warning',is_live:true});
  if (alerts.length === 0) alerts.push({title:'Weather Suitable for Farm Activity',detail:`Live weather currently shows no major rain, heat, or wind threshold${location}. Continue normal field monitoring${crop}.`,alert_type:'weather',severity:'info',is_live:true});
  return alerts;
}
