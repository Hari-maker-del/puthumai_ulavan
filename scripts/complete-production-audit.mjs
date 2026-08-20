import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const required=[
  'src/services/realtimeManager.ts',
  'src/services/farmerOnboardingService.ts',
  'src/services/dataOwnershipService.ts',
  'src/services/farmerSyncCoordinator.ts',
  'src/services/offlineOperationService.ts',
  'src/services/externalApiHealthService.ts',
  'src/services/authorizationService.ts',
  'src/services/provenanceService.ts',
  'src/services/resilientFetchService.ts',
  'docs/COMPLETE-FARMER-ACCEPTANCE.md',
  'docs/REAL-FARMER-DEPLOYMENT-CHECKLIST.md',
];

for(const f of required) if(!fs.existsSync(path.join(root,f))) failures.push(`Missing: ${f}`);

for(const f of ['.env','.env.local','.env.production','.git','dist','node_modules'])
  if(fs.existsSync(path.join(root,f))) failures.push(`Forbidden release artifact: ${f}`);

const source=[];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','.git','dist'].includes(e.name)) continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(/\.(ts|tsx|js|jsx|sql)$/.test(e.name)) source.push(p);
  }
}
walk(path.join(root,'src'));

const patterns=[
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/i,
  /sk-[A-Za-z0-9]{20,}/,
  /AIza[A-Za-z0-9_-]{20,}/
];
for(const f of source){
  const text=fs.readFileSync(f,'utf8');
  for(const pat of patterns) if(pat.test(text)) failures.push(`Possible secret in ${path.relative(root,f)}`);
}

if(failures.length){
  console.error('COMPLETE PRODUCTION AUDIT FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('COMPLETE PRODUCTION STATIC AUDIT PASSED');
console.log('Live acceptance still requires the real Supabase/Vercel/mobile environment.');
