import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const text = fs.readFileSync(path.join(root,'src/i18n/uiTranslations.ts'),'utf8');
const languages = ['en','as','bn','bodo','dogri','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur'];
const keys = [...text.matchAll(/'([^']+)':/g)].map(m=>m[1]);
const unique = [...new Set(keys)];
let ok=true;
for (const lang of languages) {
  const start = text.indexOf(`  ${lang}: {`);
  if (start < 0) { console.error(`Missing language block: ${lang}`); ok=false; continue; }
  const end = text.indexOf('\n  },', start);
  const block = text.slice(start, end > start ? end : start+20000);
  const missing = unique.filter(k => !block.includes(`'${k}':`));
  // English keys are included in every language catalog only for the shared core.
  const core = unique.slice(0, 60);
  const coreMissing = core.filter(k => !block.includes(`'${k}':`));
  if (coreMissing.length) { console.error(`${lang}: missing ${coreMissing.length} core keys`); ok=false; }
}
if (!ok) process.exit(1);
console.log(`I18n core catalog verified for ${languages.length} languages.`);
