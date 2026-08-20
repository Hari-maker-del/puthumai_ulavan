import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { resendSignupVerification } from '@/services/authVerificationService';

export default function VerifyEmailPage() {
  const location = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(location.search);
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resend = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || loading || cooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const { error: resendError } = await resendSignupVerification(normalized);
      if (resendError) {
        const message = resendError.message.toLowerCase();
        if (message.includes('rate limit') || message.includes('too many')) {
          setCooldown(60);
          setError('Too many requests. Please wait before requesting another email.');
        } else {
          setError('We could not resend the verification email. Please try again later.');
        }
        return;
      }
      setSent(true);
      setCooldown(60);
      toast('A new verification email has been sent.', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-[#F8FAF7] p-6">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        {sent ? <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" /> : <MailCheck className="mx-auto h-12 w-12 text-brand-600" />}
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Verify your email</h1>
        <p className="mt-2 text-sm text-ink-600">
          We sent a verification link to <strong>{email || 'your email address'}</strong>.
          Open the email and use the link to activate your account.
        </p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

        <label className="mt-6 block text-left text-sm font-semibold text-ink-900" htmlFor="verify-email">
          Email address
        </label>
        <input
          id="verify-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="button"
          onClick={resend}
          disabled={loading || cooldown > 0 || !email.trim()}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
        </button>

        <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-brand-600">
          Back to login
        </Link>
      </section>
    </main>
  );
}
