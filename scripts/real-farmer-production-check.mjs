import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/services/farmerOnboardingService.ts',
  'src/services/dataOwnershipService.ts',
  'src/services/farmerRealtimeRegistry.ts',
  'src/services/offlineOperationService.ts',
  'src/services/externalApiHealthService.ts',
  'src/services/authorizationService.ts',
  'src/hooks/useFarmerRealtimeStatus.ts',
  'supabase/migrations/20260817_real_farmer_rls_gate.sql',
  'docs/REAL-FARMER-DEPLOYMENT-CHECKLIST.md',
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const forbidden of ['.env', '.env.local', '.env.production', 'node_modules', 'dist', '.git']) {
  if (fs.existsSync(path.join(root, forbidden))) failures.push(`Forbidden artifact: ${forbidden}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const s of ['build']) if (!pkg.scripts?.[s]) failures.push(`Missing script: ${s}`);

if (failures.length) {
  console.error('REAL FARMER STATIC CHECK FAILED');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('REAL FARMER STATIC CHECK PASSED');
console.log('Live Supabase/Vercel/email/device tests must be run against the real deployment.');
