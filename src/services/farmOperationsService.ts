import { supabase, supabaseMisconfigured } from '@/lib/supabase';

export async function listFields(userId: string) {
  if (supabaseMisconfigured) throw new Error('Live farm data is not configured.');

  const farms = await supabase.from('farms').select('id').eq('user_id', userId);
  if (farms.error) throw farms.error;

  const farmIds = (farms.data ?? []).map(row => row.id).filter(Boolean);
  if (!farmIds.length) return [];

  const result = await supabase
    .from('fields')
    .select('*')
    .in('farm_id', farmIds)
    .order('name');

  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function listTasks(userId:string, from?:string, to?:string){
  if(supabaseMisconfigured) throw new Error('Live task data is not configured.');
  let q=supabase.from('farm_tasks').select('*').eq('user_id',userId).order('due_at');
  if(from)q=q.gte('due_at',from);
  if(to)q=q.lte('due_at',to);
  const r=await q;
  if(r.error)throw r.error;
  return r.data??[];
}
