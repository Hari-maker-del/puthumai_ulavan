import { supabase, supabaseMisconfigured } from '@/lib/supabase';

export type FieldRecord = {
  id: string;
  farm_id: string;
  user_id: string;
  name: string;
  area_acres: number;
  soil_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
};

export function validateField(field: Pick<FieldRecord, 'name' | 'area_acres'>) {
  if (!field.name.trim()) throw new Error('Field name is required.');
  if (!Number.isFinite(field.area_acres) || field.area_acres <= 0) throw new Error('Field area must be greater than zero.');
  return field;
}

export async function listFieldsForFarm(farmId: string): Promise<FieldRecord[]> {
  if (supabaseMisconfigured) throw new Error('Live field data is not configured.');
  const { data, error } = await supabase.from('fields').select('*').eq('farm_id', farmId).order('name');
  if (error) throw error;
  return (data ?? []) as FieldRecord[];
}

export async function createField(input: Omit<FieldRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FieldRecord> {
  if (supabaseMisconfigured) throw new Error('Live field data is not configured.');
  validateField(input);
  const { data, error } = await supabase.from('fields').insert({
    farm_id: input.farm_id,
    name: input.name.trim(),
    area_acres: input.area_acres,
    soil_type: input.soil_type ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  }).select('*').single();
  if (error) throw error;
  return data as FieldRecord;
}

export async function updateField(id: string, input: Partial<Omit<FieldRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  if (supabaseMisconfigured) throw new Error('Live field data is not configured.');
  if (input.name !== undefined || input.area_acres !== undefined) {
    validateField({ name: input.name ?? 'Field', area_acres: input.area_acres ?? 1 });
  }
  const { data, error } = await supabase.from('fields').update({
    ...(input.farm_id !== undefined ? { farm_id: input.farm_id } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.area_acres !== undefined ? { area_acres: input.area_acres } : {}),
    ...(input.soil_type !== undefined ? { soil_type: input.soil_type } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
  }).eq('id', id).select('*').single();
  if (error) throw error;
  return data as FieldRecord;
}

export async function deleteField(id: string) {
  if (supabaseMisconfigured) throw new Error('Live field data is not configured.');
  const { error } = await supabase.from('fields').delete().eq('id', id);
  if (error) throw error;
}
