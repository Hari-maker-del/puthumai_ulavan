import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];

const required = [
  'package.json',
  'package-lock.json',
  'src/lib/supabase.ts',
  'src/context/AuthContext.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/RegisterPage.tsx',
  'src/pages/ForgotPasswordPage.tsx',
  'src/pages/ResetPasswordPage.tsx',
  'src/services/authVerificationService.ts',
  'src/pages/AuthCallbackPage.tsx',
  'src/pages/VerifyEmailPage.tsx',
  'src/services/dataProvenanceService.ts',
  'src/services/aiDecisionService.ts',
  'src/services/farmDigitalTwinService.ts',
  'src/services/farmOutcomeLearningService.ts',
  'src/services/offlineConflictService.ts',
  'src/services/resilienceService.ts',
  'docs/PRODUCTION-QUALITY-GATE.md',
  'docs/AUTHENTICATION-PRODUCTION.md',
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required production file: ${file}`);
}

for (const bad of ['.env', '.env.local', '.env.production', 'node_modules', 'dist', '.git']) {
  if (fs.existsSync(path.join(root, bad))) failures.push(`Forbidden release artifact present: ${bad}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.name !== 'puthumai-uzhavan') failures.push(`Unexpected package name: ${pkg.name}`);
for (const script of ['build', 'lint', 'typecheck']) {
  if (!pkg.scripts?.[script]) failures.push(`Missing npm script: ${script}`);
}

const allSource = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.git','dist'].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|sql)$/.test(entry.name)) allSource.push(p);
  }
}
walk(path.join(root, 'src'));

const secretPatterns = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/i,
  /sk-[A-Za-z0-9]{20,}/,
  /AIza[A-Za-z0-9_-]{20,}/,
];
for (const file of allSource) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) failures.push(`Possible secret/private key pattern in ${path.relative(root, file)}`);
  }
}

const supabase = fs.readFileSync(path.join(root, 'src/lib/supabase.ts'), 'utf8');
if (!supabase.includes('persistSession')) warnings.push('Supabase persistSession configuration was not found by static scan.');
if (!supabase.includes('autoRefreshToken')) warnings.push('Supabase autoRefreshToken configuration was not found by static scan.');

console.log('FINAL PRODUCTION STATIC AUDIT');
if (failures.length) {
  console.error('FAILED');
  failures.forEach(x => console.error(`- ${x}`));
  process.exitCode = 1;
} else {
  console.log('PASSED');
}
warnings.forEach(x => console.warn(`WARNING: ${x}`));

console.log('\nREAL-ENVIRONMENT GATES (must be tested against your actual services):');
console.log('1. Supabase: two-user RLS isolation test.');
console.log('2. Supabase: real signup -> email -> /auth/callback -> dashboard.');
console.log('3. Vercel: production environment variables and Ready deployment.');
console.log('4. Gemini/OpenWeather: valid, 401, 429, timeout, offline scenarios.');
console.log('5. Android: camera, microphone, responsive UI, offline/reconnect.');
