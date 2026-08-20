import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json','package-lock.json','src/main.tsx','src/App.tsx',
  'src/context/AuthContext.tsx','src/pages/AuthCallbackPage.tsx',
  'src/pages/VerifyEmailPage.tsx','src/services/runtimeMonitoringService.ts',
  'src/services/dataProvenanceService.ts','src/services/aiDecisionService.ts',
  'src/services/farmDigitalTwinService.ts','src/services/offlineConflictService.ts',
  'src/services/resilienceService.ts','supabase/migrations/005_production_data_integrity.sql',
  'docs/FINAL-QUALITY-GATE.md','docs/RLS-TEST-PLAN.md',
  'docs/REAL-INTEGRATION-CHECKLIST.md','docs/MOBILE-ACCESSIBILITY-CHECKLIST.md'
];
const failures=[];
for(const f of required) if(!fs.existsSync(path.join(root,f))) failures.push(`Missing: ${f}`);
for(const f of ['.env','.env.local','.env.production']) if(fs.existsSync(path.join(root,f))) failures.push(`Secret file present: ${f}`);
for(const d of ['node_modules','dist','.git']) if(fs.existsSync(path.join(root,d))) failures.push(`Release directory present: ${d}`);
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const s of ['build','lint','typecheck','production:audit','auth:check']) if(!pkg.scripts?.[s]) failures.push(`Missing npm script: ${s}`);
if(failures.length){console.error('FINAL QUALITY CHECK: FAILED'); failures.forEach(x=>console.error('- '+x)); process.exit(1);}
console.log('FINAL QUALITY CHECK: PASSED');
console.log('Structural checks passed. Real Supabase/Vercel/API checks require the configured environment.');
