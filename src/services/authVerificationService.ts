import { supabase } from '@/lib/supabase';

export type VerificationResult =
  | { ok: true; message: string }
  | { ok: false; code: 'missing' | 'expired' | 'invalid' | 'network' | 'unverified'; message: string };

export async function handleEmailVerificationCallback(url: string): Promise<VerificationResult> {
  try {
    const parsed = new URL(url);

    const tokenHash = parsed.searchParams.get('token_hash');
    const type = parsed.searchParams.get('type');
    if (tokenHash && type === 'signup') {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'signup' });
      if (error) {
        const message = error.message.toLowerCase();
        return {
          ok: false,
          code: message.includes('expired') ? 'expired' : 'invalid',
          message: message.includes('expired')
            ? 'This verification link has expired. Please request a new one.'
            : 'This verification link is invalid or has already been used.',
        };
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.email_confirmed_at) {
        return { ok: false, code: 'unverified', message: 'Verification completed, but the session is not ready yet. Please sign in again.' };
      }
      return { ok: true, message: 'Email verified successfully. Welcome to Puthumai Uzhavan!' };
    }

    const code = parsed.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { ok: false, code: 'invalid', message: 'This verification link is invalid or has expired.' };
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.email_confirmed_at) {
        return { ok: false, code: 'unverified', message: 'Verification completed, but the session is not ready yet. Please sign in again.' };
      }
      return { ok: true, message: 'Email verified successfully. Welcome to Puthumai Uzhavan!' };
    }

    // Supabase implicit-flow links can place access/refresh tokens in the URL hash.
    // Supabase may process these automatically because detectSessionInUrl is enabled.
    // We also explicitly restore them to make the callback deterministic.
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, '').replace(/^\?/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return { ok: false, code: 'invalid', message: 'This verification session is invalid or expired.' };
      return { ok: true, message: 'Email verified successfully. Welcome to Puthumai Uzhavan!' };
    }

    // In some configurations the SDK consumes the URL before this page runs.
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.user) {
      if (!data.session.user.email_confirmed_at) {
        return { ok: false, code: 'unverified', message: 'Your email has not been verified yet. Please use a fresh verification link.' };
      }
      return { ok: true, message: 'Email verified successfully. Welcome to Puthumai Uzhavan!' };
    }

    return { ok: false, code: 'missing', message: 'This verification link is missing required information.' };
  } catch (error) {
    console.error('Email verification callback failed:', error);
    return { ok: false, code: 'network', message: 'We could not complete verification. Please check your connection and try again.' };
  }
}

export async function resendSignupVerification(email: string) {
  return supabase.auth.resend({ type: 'signup', email: email.trim() });
}
