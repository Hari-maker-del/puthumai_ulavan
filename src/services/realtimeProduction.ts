import type { RealtimeChannel } from '@supabase/supabase-js';
import {supabase,supabaseMisconfigured} from '@/lib/supabase';
const active=new Map<string,RealtimeChannel>();
export function subscribeFarmerTable(table:string,filter:string,onChange:()=>void,onStatus?:(_s:string)=>void){
 if(supabaseMisconfigured){onStatus?.('disabled');return()=>{}}
 const key=`${table}:${filter}`; const old=active.get(key); if(old)void supabase.removeChannel(old);
 let stopped=false,attempts=0;
 const connect=()=>{if(stopped)return;onStatus?.(attempts?'reconnecting':'connecting');const ch=supabase.channel(`farmer:${key}`).on('postgres_changes',{event:'*',schema:'public',table,filter},()=>{onStatus?.('live');onChange()}).subscribe((st)=>{if(stopped)return;if(st==='SUBSCRIBED'){attempts=0;onStatus?.('live')}else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){onStatus?.('error');const delay=Math.min(1000*2**attempts,30000);attempts++;setTimeout(connect,delay)}else if(st==='CLOSED')onStatus?.('offline')});active.set(key,ch)};
 connect(); return()=>{stopped=true;const ch=active.get(key);active.delete(key);if(ch)void supabase.removeChannel(ch)}
}
