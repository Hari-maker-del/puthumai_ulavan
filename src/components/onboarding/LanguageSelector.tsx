import { Globe2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, languages, languageInfo, t } = useI18n();
  return (
    <div className={compact ? 'flex items-center gap-2' : 'w-full'}>
      <label htmlFor="app-language" className="sr-only">{t('chooseLanguage')}</label>
      <div className="relative">
        <Globe2 size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" />
        <select
          id="app-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={`appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-400 ${compact ? 'min-w-[170px]' : 'w-full'}`}
          aria-label={t('chooseLanguage')}
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>{item.nativeName} — {item.englishName}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500">⌄</span>
      </div>
      <span className="sr-only">{languageInfo.nativeName}</span>
    </div>
  );
}
