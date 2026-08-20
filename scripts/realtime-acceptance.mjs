import process from 'node:process';

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('REALTIME ACCEPTANCE: BLOCKED');
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  console.error('This test intentionally refuses to fake a live Supabase result.');
  process.exit(2);
}

console.log('REALTIME ACCEPTANCE: live environment detected.');
console.log('Run the two-device checklist in docs/REALTIME-FARMER-ACCEPTANCE.md.');
console.log('Automated code checks cannot prove cross-device RLS behavior without a configured test tenant.');
