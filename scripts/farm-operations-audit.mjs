import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();
const required=[
'src/services/fieldOperationsService.ts','src/services/taskSchedulerService.ts','src/services/inventoryService.ts',
'src/services/irrigationService.ts','src/services/equipmentService.ts','src/services/salesService.ts',
'src/services/soilTestService.ts','src/services/knowledgeService.ts','src/services/communityService.ts',
'docs/FARM-OPERATIONS-IMPLEMENTATION.md','supabase/migrations/20260825_farm_operations_rls.sql'
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
if(missing.length){console.error('FARM OPERATIONS AUDIT FAILED');missing.forEach(x=>console.error('- Missing '+x));process.exit(1);}
let bad=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git','dist'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx|js|jsx)$/.test(e.name)){const t=fs.readFileSync(p,'utf8');if(/localhost:8000/.test(t))bad.push(path.relative(root,p)+': localhost fallback');if(/dummyData|mockData/.test(t)&&/pages|components/.test(path.relative(root,p)))bad.push(path.relative(root,p)+': farmer-facing mock reference');}}}
walk(path.join(root,'src'));
if(bad.length){console.error('FARM OPERATIONS AUDIT FAILED');bad.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('FARM OPERATIONS STATIC AUDIT PASSED');
