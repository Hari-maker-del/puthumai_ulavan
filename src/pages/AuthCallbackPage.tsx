import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { handleEmailVerificationCallback } from '@/services/authVerificationService';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<{ status: 'loading'|'success'|'error'; message: string }>({
    status: 'loading',
    message: 'Verifying your email…',
  });

  useEffect(() => {
    let active = true;
    handleEmailVerificationCallback(window.location.href).then(result => {
      if (!active) return;
      if (result.ok) {
        setState({ status: 'success', message: result.message });
        window.setTimeout(async () => {
          const { data } = await (await import('@/lib/supabase')).supabase.auth.getUser();
          const metadata = data.user?.user_metadata ?? {};
          const role = metadata.role;
          const completed = metadata.onboarding_completed === true;
          navigate(completed ? '/dashboard' : role === 'farmer' ? '/onboarding/farm' : '/onboarding/role', { replace: true });
        }, 900);
      } else {
        setState({ status: 'error', message: result.message });
      }
    });
    return () => { active = false; };
  }, [navigate]);

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        {state.status === 'loading' && <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-600" />}
        {state.status === 'success' && <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-600" />}
        {state.status === 'error' && <XCircle className="mx-auto mb-4 h-10 w-10 text-rose-600" />}
        <h1 className="text-xl font-semibold">
          {state.status === 'success' ? 'Email verified' : state.status === 'error' ? 'Verification failed' : 'Verify email'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{state.message}</p>
        {state.status === 'error' && (
          <button onClick={() => navigate('/login')} className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">
            Go to login
          </button>
        )}
      </section>
    </main>
  );
}
