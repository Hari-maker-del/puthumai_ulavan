import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sprout } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import LanguageSelector from '@/components/onboarding/LanguageSelector';
import FarmerMemoryPage from '@/pages/app/FarmerMemoryPage';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { getFarmerMemory } from '@/services/farmerMemoryService';

export default function OnboardingFarmPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getFarmerMemory(user.id).then(async (memory) => {
      if (memory) {
        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.updateUser({ data: { role: 'farmer', onboarding_completed: true } });
        navigate('/dashboard', { replace: true });
      }
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, [user?.id, navigate]);

  if (checking) return <div className="min-h-screen grid place-items-center bg-brand-50"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4"><Logo size="md" /><LanguageSelector compact /></div>
        <section className="mb-5 rounded-3xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
          <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><Sprout size={23} /></div><div><h1 className="font-display text-2xl font-extrabold text-ink-900">{t('setupFarm')}</h1><p className="mt-1 text-sm leading-6 text-ink-600">{t('setupFarmDesc')}</p></div></div>
        </section>
        <FarmerMemoryPage firstTimeOnboarding onComplete={() => navigate('/dashboard', { replace: true })} />
      </div>
    </main>
  );
}
