import { execSync } from 'node:child_process';
import fs from 'node:fs';

const required = [
  'package.json',
  'package-lock.json',
  'src/services/geminiService.ts',
  'src/services/aiFarmContextService.ts',
  'src/services/farmDigitalTwinService.ts',
  'src/services/farmOutcomeLearningService.ts',
  'src/services/offlineSyncEngine.ts',
  'src/services/offlineConflictService.ts',
  'docs/SUPABASE-RLS-TEST-PLAN.md',
  'docs/DATA-PROVENANCE.md',
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
for (const forbidden of ['.env', '.env.local', 'node_modules', 'dist']) {
  if (fs.existsSync(forbidden)) throw new Error(`Release contains ${forbidden}`);
}
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (!pkg.scripts?.build || !pkg.scripts?.typecheck || !pkg.scripts?.lint) {
  throw new Error('Required production npm scripts are missing');
}
console.log('Structural production smoke test: PASS');
console.log('Run: npm ci && npm run typecheck && npm run lint && npm run build');
