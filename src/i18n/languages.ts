export interface AppLanguage {
  code: string;
  nativeName: string;
  englishName: string;
  locale: string;
  dir?: 'ltr' | 'rtl';
}

export const APP_LANGUAGES: AppLanguage[] = [
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese', locale: 'as-IN' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', locale: 'bn-IN' },
  { code: 'bodo', nativeName: 'बड़ो', englishName: 'Bodo', locale: 'brx-IN' },
  { code: 'dogri', nativeName: 'डोगरी', englishName: 'Dogri', locale: 'doi-IN' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', locale: 'gu-IN' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', locale: 'hi-IN' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', locale: 'kn-IN' },
  { code: 'ks', nativeName: 'कॉशुर / کٲشُر', englishName: 'Kashmiri', locale: 'ks-IN' },
  { code: 'kok', nativeName: 'कोंकणी', englishName: 'Konkani', locale: 'kok-IN' },
  { code: 'mai', nativeName: 'मैथिली', englishName: 'Maithili', locale: 'mai-IN' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', locale: 'ml-IN' },
  { code: 'mni', nativeName: 'মৈতৈলোন্', englishName: 'Manipuri (Meitei)', locale: 'mni-IN' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', locale: 'mr-IN' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali', locale: 'ne-IN' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia', locale: 'or-IN' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', locale: 'pa-IN' },
  { code: 'sa', nativeName: 'संस्कृतम्', englishName: 'Sanskrit', locale: 'sa-IN' },
  { code: 'sat', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', englishName: 'Santali', locale: 'sat-IN' },
  { code: 'sd', nativeName: 'سنڌي', englishName: 'Sindhi', locale: 'sd-IN' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', locale: 'ta-IN' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', locale: 'te-IN' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', locale: 'ur-IN', dir: 'rtl' },
  { code: 'en', nativeName: 'English', englishName: 'English', locale: 'en-IN' },
];

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'puthumai_uzhavan_language';

export function getLanguage(code?: string | null): AppLanguage {
  return APP_LANGUAGES.find((l) => l.code === code) ?? APP_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;
}
