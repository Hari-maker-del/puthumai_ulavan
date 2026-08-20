import { supabase, supabaseMisconfigured } from '@/lib/supabase';

export interface OnboardingState {
  profileComplete: boolean;
  farmCreated: boolean;
  cropCreated: boolean;
  firstExpenseCreated: boolean;
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  if (supabaseMisconfigured) {
    return { profileComplete: false, farmCreated: false, cropCreated: false, firstExpenseCreated: false };
  }

  const [profile, farms, crops, expenses] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
    supabase.from('farms').select('id').eq('owner_id', userId).limit(1),
    supabase.from('crops').select('id').eq('user_id', userId).limit(1),
    supabase.from('expenses').select('id').eq('user_id', userId).limit(1),
  ]);

  return {
    profileComplete: !profile.error && !!profile.data,
    farmCreated: !farms.error && (farms.data?.length ?? 0) > 0,
    cropCreated: !crops.error && (crops.data?.length ?? 0) > 0,
    firstExpenseCreated: !expenses.error && (expenses.data?.length ?? 0) > 0,
  };
}
