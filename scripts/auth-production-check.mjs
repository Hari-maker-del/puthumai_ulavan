import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/lib/supabase.ts',
  'src/services/authVerificationService.ts',
  'src/pages/AuthCallbackPage.tsx',
  'src/pages/VerifyEmailPage.tsx',
  'src/App.tsx',
  'src/context/AuthContext.tsx',
  'src/components/auth/ProtectedRoute.tsx',
  'docs/AUTHENTICATION-PRODUCTION.md',
  '.github/workflows/auth-production.yml',
];
const failures = required.filter(f => !fs.existsSync(path.join(root, f)));

const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('src/App.tsx');
if (!app.includes('path="/auth/callback"')) failures.push('App.tsx missing /auth/callback route');
if (!app.includes('path="/verify-email"')) failures.push('App.tsx missing /verify-email route');

const register = read('src/pages/RegisterPage.tsx');
if (!register.includes('/verify-email?email=')) failures.push('RegisterPage does not route new users to verification page');

const supabase = read('src/lib/supabase.ts');
for (const requiredSetting of ['persistSession: true', 'autoRefreshToken: true', 'detectSessionInUrl: true']) {
  if (!supabase.includes(requiredSetting)) failures.push(`supabase.ts missing ${requiredSetting}`);
}

const authContext = read('src/context/AuthContext.tsx');
for (const requiredCall of ['auth.getSession()', 'auth.onAuthStateChange(', 'subscription.unsubscribe()', "signOut({ scope: 'local' })"]) {
  if (!authContext.includes(requiredCall)) failures.push(`AuthContext missing ${requiredCall}`);
}
if (!authContext.includes('setLoading(false)')) failures.push('AuthContext does not finish auth initialization');

const protectedRoute = read('src/components/auth/ProtectedRoute.tsx');
if (!protectedRoute.includes('if (loading)')) failures.push('ProtectedRoute does not wait for auth loading');
if (!protectedRoute.includes('<Navigate to="/login"')) failures.push('ProtectedRoute missing unauthenticated redirect');

const service = read('src/services/authVerificationService.ts');
for (const requiredCall of ['verifyOtp', 'exchangeCodeForSession', 'setSession', "resend({ type: 'signup'"]) {
  if (!service.includes(requiredCall)) failures.push(`authVerificationService missing ${requiredCall}`);
}

if (fs.existsSync(path.join(root, '.env')) || fs.existsSync(path.join(root, '.env.local'))) {
  failures.push('local environment secret file present');
}

if (failures.length) {
  console.error('AUTH PRODUCTION CHECK FAILED');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('AUTH PRODUCTION CHECK PASSED');
console.log('Session persistence, startup restoration, protected routing, signup verification, callback, and logout contracts are present.');
console.log('Real email click-through and browser storage behavior still require a live Supabase test.');
