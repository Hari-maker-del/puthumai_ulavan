import { supabase, supabaseMisconfigured } from '@/lib/supabase';
export async function listSoilTests(userId:string){if(supabaseMisconfigured)throw new Error('Soil tests are not configured.');const r=await supabase.from('soil_tests').select('*').eq('user_id',userId).order('tested_at',{ascending:false});if(r.error)throw r.error;return r.data??[];}
