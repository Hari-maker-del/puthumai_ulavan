import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, User, LogOut, ChevronRight, Moon, Sun,
  Languages, Bell, Shield, HelpCircle, Mail, Loader2,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
type SettingItem = { icon: string; label: string; value: string; toggle?: boolean; on?: boolean };
type SettingGroup = { title: string; items: SettingItem[] };

const defaultSettingGroups: SettingGroup[] = [
  { title: 'Notifications', items: [
    { icon: 'Bell', label: 'Weather alerts', value: 'On', toggle: true, on: true },
    { icon: '', label: 'Crop alerts', value: 'On', toggle: true, on: true },
    { icon: '', label: 'Expense alerts', value: 'On', toggle: true, on: true },
    { icon: '', label: 'Market alerts', value: 'On', toggle: true, on: true },
  ] },
  { title: 'Security', items: [
    { icon: 'Shield', label: 'Authenticated account', value: 'Protected by Supabase Auth' },
  ] },
  { title: 'Help & Support', items: [
    { icon: 'HelpCircle', label: 'Farm data support', value: 'Use the AI assistant or local agriculture officer for help.' },
  ] },
];
import { APP_LANGUAGES } from '@/i18n/languages';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { language: activeLanguage, setLanguage: setActiveLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SettingGroup[]>(defaultSettingGroups);
  const { darkMode, setDarkMode } = useTheme();
  const [language, setLanguage] = useState(profile?.preferred_language ?? localStorage.getItem('puthumai_uzhavan_language') ?? 'en');
  const [savingLang, setSavingLang] = useState(false);

  const toggle = (groupTitle: string, label: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.title === groupTitle
          ? { ...g, items: g.items.map((it) => (it.label === label ? { ...it, on: !it.on } : it)) }
          : g,
      ),
    );
    toast(`${label} ${groups.flatMap((g) => g.items).find((it) => it.label === label)?.on ? 'disabled' : 'enabled'}`, 'info');
  };

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out successfully', 'info');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setLanguage(profile?.preferred_language ?? activeLanguage);
  }, [profile?.preferred_language, activeLanguage]);

  const saveLanguage = async () => {
    if (!user) return;
    setSavingLang(true);
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_language: language })
      .eq('id', user.id);
    setSavingLang(false);
    if (error) {
      toast('Could not save your language. Please try again.', 'error');
      return;
    }
    setActiveLanguage(language);
    localStorage.setItem('puthumai_uzhavan_language', language);
    await supabase.auth.updateUser({ data: { preferred_language: language } });
    await refreshProfile();
    toast('Language preference saved', 'success');
  };

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Farmer';

  const getLanguageLabel = (code: string) => {
    const selected = APP_LANGUAGES.find((item) => item.code === code);
    return selected ? `${selected.nativeName} (${selected.englishName})` : code;
  };


  return (
    <div className="space-y-6">
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Manage your account, preferences, and appearance." />

      {/* profile banner */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard padding="lg" className="flex flex-col sm:flex-row sm:items-center gap-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="h-16 w-16 rounded-xl object-cover shadow-card flex-shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-brand-600 grid place-items-center text-white font-display font-extrabold text-2xl shadow-card flex-shrink-0">
              {displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="font-display font-extrabold text-xl text-ink-900">{displayName}</div>
            <div className="text-sm text-ink-800/55">{user?.email}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-brand-100 text-brand-700 px-2.5 py-1 text-[11px] font-bold">
                {profile?.village ?? 'Location not set'}
              </span>
              <span className="rounded-lg bg-accent-50 text-accent-700 px-2.5 py-1 text-[11px] font-bold">
                {profile?.farm_size ? `${profile.farm_size} acres` : 'No farm size'}
              </span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard/profile')}>
            <User size={16} /> Edit profile
          </Button>
        </GlassCard>
      </motion.div>

      {/* appearance + language */}
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              {darkMode ? <Moon size={18} className="text-brand-600" /> : <Sun size={18} className="text-brand-600" />}
              <div className="font-display font-bold text-ink-900">Appearance</div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <div className="h-9 w-9 rounded-xl bg-brand-50 grid place-items-center flex-shrink-0">
                {darkMode ? <Moon size={17} className="text-brand-700" /> : <Sun size={17} className="text-brand-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900">Dark Mode</div>
                <div className="text-xs text-ink-600">Switch between light and dark themes</div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-brand-600' : 'bg-ink-900/15'}`}
                aria-label="Toggle dark mode"
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${darkMode ? 'left-[22px]' : 'left-0.5'}`}
                />
              </button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Languages size={18} className="text-brand-600" />
              <div>
                <div className="font-display font-bold text-ink-900">{t('Language')}</div>
                <div className="text-xs text-ink-600">{t('Change the app language anytime')}</div>
              </div>
            </div>

            <label htmlFor="settings-language" className="sr-only">{t('Choose your language')}</label>
            <select
              id="settings-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-500"
            >
              {APP_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} — {lang.englishName}
                </option>
              ))}
            </select>

            <div className="mt-3 rounded-2xl bg-brand-50 p-3 text-xs text-ink-700">
              <span className="font-semibold">{t('Selected language')}:</span> {getLanguageLabel(language)}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-ink-600">{t('Numbers remain in English digits (0–9).')}</div>
              <Button size="sm" onClick={saveLanguage} disabled={savingLang || language === profile?.preferred_language}>
                {savingLang ? <Loader2 size={15} className="animate-spin" /> : t('Save language')}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* setting groups */}
      <div className="grid lg:grid-cols-2 gap-5">
        {groups.map((group, gi) => (
          <motion.div key={group.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}>
            <GlassCard padding="lg">
              <div className="flex items-center gap-2 mb-4">
                {group.title === 'Notifications' && <Bell size={18} className="text-brand-600" />}
                {group.title === 'Security' && <Shield size={18} className="text-brand-600" />}
                {group.title === 'Help & Support' && <HelpCircle size={18} className="text-brand-600" />}
                <div className="font-display font-bold text-ink-900">{group.title}</div>
              </div>
              <div className="divide-y divide-ink-900/5">
                {group.items.map((it) => {
                  const item: SettingItem = it;
                  return (
                    <div key={item.label} className="flex items-center gap-3 py-3">
                      <div className="h-9 w-9 rounded-xl bg-brand-50 grid place-items-center flex-shrink-0">
                        <Icon name={item.icon} size={17} className="text-brand-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-ink-900">{item.label}</div>
                        {!item.toggle && <div className="text-xs text-ink-600 truncate">{item.value}</div>}
                      </div>
                      {item.toggle ? (
                        <button
                          onClick={() => toggle(group.title, item.label)}
                          className={`relative h-6 w-11 rounded-full transition-colors ${item.on ? 'bg-brand-600' : 'bg-ink-900/15'}`}
                          aria-label={`Toggle ${item.label}`}
                        >
                          <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${item.on ? 'left-[22px]' : 'left-0.5'}`}
                          />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-semibold text-ink-800/55">
                          {item.value}
                          <ChevronRight size={15} className="text-ink-800/30" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* account info */}
      <GlassCard padding="lg">
        <div className="font-display font-bold text-ink-900 mb-4">Account</div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-50 grid place-items-center flex-shrink-0">
              <Mail size={17} className="text-brand-700" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink-900">Email</div>
              <div className="text-xs text-ink-600">{user?.email}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-center">
        <button onClick={handleSignOut} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-error-500/10 text-error-600 px-6 py-3 text-sm font-semibold hover:bg-error-500/20 transition-colors">
          <LogOut size={17} /> Sign out of Puthumai Uzhavan
        </button>
      </div>
    </div>
  );
}
