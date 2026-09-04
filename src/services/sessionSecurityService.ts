import {supabase} from '@/lib/supabase';
export const signOutThisDevice=()=>supabase.auth.signOut({scope:'local'});
export const signOutEverywhere=()=>supabase.auth.signOut({scope:'global'});
