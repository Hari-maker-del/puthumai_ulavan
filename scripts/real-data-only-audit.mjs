import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const forbidden=[
  /localhost:8000/,
  /fallback mock/i,
  /using fallback mock/i,
  /return mock[A-Z_]/,
];
const files=[];
function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    if(['node_modules','.git','dist'].includes(e.name)) continue;
    const p=path.join(d,e.name);
    if(e.isDirectory()) walk(p);
    else if(/\.(ts|tsx|js|jsx)$/.test(e.name)) files.push(p);
  }
}
walk(path.join(root,'src'));

for(const f of files){
  const t=fs.readFileSync(f,'utf8');
  for(const rx of forbidden){
    if(rx.test(t)) failures.push(`${path.relative(root,f)} matches ${rx}`);
  }
}

const productionServices=[
  'src/services/authService.ts',
  'src/services/dashboardService.ts',
  'src/services/yieldService.ts',
  'src/services/chatService.ts',
  'src/services/reportService.ts',
  'src/services/scannerService.ts',
];
for(const f of productionServices){
  if(!fs.existsSync(path.join(root,f))) failures.push(`Missing ${f}`);
  else if(f!=='src/services/scannerService.ts'){
    const t=fs.readFileSync(path.join(root,f),'utf8');
    if(/mockData|USE_MOCK/.test(t)) failures.push(`${f} still contains a mock production path`);
  }
}

if(failures.length){
  console.error('REAL-DATA-ONLY AUDIT FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('REAL-DATA-ONLY AUDIT PASSED');
