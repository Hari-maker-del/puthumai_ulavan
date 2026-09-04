import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sprout, UserRound, Tractor } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import LanguageSelector from '@/components/onboarding/LanguageSelector';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function OnboardingRolePage() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'farmer' | 'visitor' | null>(null);
  const [saving, setSaving] = useState(false);

  const continueOnboarding = async () => {
    if (!user || !role || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { role, preferred_language: language, onboarding_started: true } });
      if (error) throw error;
      if (role === 'farmer') navigate('/onboarding/farm', { replace: true });
      else {
        await supabase.auth.updateUser({ data: { onboarding_completed: true } });
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Logo size="md" />
          <LanguageSelector compact />
        </div>
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-card sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Sprout size={32} /></div>
            <h1 className="mt-5 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">{t('howUse')}</h1>
            <p className="mt-3 text-ink-600">{t('selectRole')}</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setRole('farmer')} className={`rounded-2xl border-2 p-6 text-left transition ${role === 'farmer' ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-brand-200'}`}>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white"><Tractor size={24} /></div>
              <h2 className="mt-5 text-xl font-extrabold text-ink-900">{t('farmer')}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">{t('farmerDesc')}</p>
            </button>
            <button type="button" onClick={() => setRole('visitor')} className={`rounded-2xl border-2 p-6 text-left transition ${role === 'visitor' ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-brand-200'}`}>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink-900 text-white"><UserRound size={24} /></div>
              <h2 className="mt-5 text-xl font-extrabold text-ink-900">{t('visitor')}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">{t('visitorDesc')}</p>
            </button>
          </div>
          <button disabled={!role || saving} onClick={continueOnboarding} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
            {t('continue')} <ArrowRight size={18} />
          </button>
        </motion.section>
      </div>
    </main>
  );
}
