import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/services/authVerificationService.ts',
  'src/pages/AuthCallbackPage.tsx',
  'src/pages/VerifyEmailPage.tsx',
  'src/App.tsx',
  'src/context/AuthContext.tsx',
  'docs/AUTHENTICATION-PRODUCTION.md',
  '.github/workflows/auth-production.yml',
];
const failures = required.filter(f => !fs.existsSync(path.join(root, f)));

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
if (!app.includes('path="/auth/callback"')) failures.push('src/App.tsx missing /auth/callback route');
if (!app.includes('path="/verify-email"')) failures.push('src/App.tsx missing /verify-email route');

const register = fs.readFileSync(path.join(root, 'src/pages/RegisterPage.tsx'), 'utf8');
if (!register.includes('/verify-email?email=')) failures.push('RegisterPage does not route new users to verification page');

const service = fs.readFileSync(path.join(root, 'src/services/authVerificationService.ts'), 'utf8');
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
console.log('Signup, callback, resend, and CI wiring are present.');
console.log('Real email click-through remains a live Supabase test.');
