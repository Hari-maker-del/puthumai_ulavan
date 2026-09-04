import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(), failures=[];
for (const f of [
  'package.json','package-lock.json',
  'src/components/AppErrorBoundary.tsx',
  'src/services/safeStorage.ts'
]) if (!fs.existsSync(path.join(root,f))) failures.push(`Missing ${f}`);

for (const f of ['.env','.env.local','.env.production','.git','dist','node_modules'])
  if (fs.existsSync(path.join(root,f))) failures.push(`Forbidden artifact ${f}`);

const css=[];
function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d,e.name);
    if(e.isDirectory() && !['node_modules','.git','dist'].includes(e.name)) walk(p);
    else if(e.isFile() && e.name.endsWith('.css')) css.push(p);
  }
}
walk(path.join(root,'src'));
if(!css.some(f=>fs.readFileSync(f,'utf8').includes('Puthumai Uzhavan responsive safety layer')))
  failures.push('Responsive CSS safety layer missing');

if(failures.length){
  console.error('ERROR-FREE/RESPONSIVE STATIC CHECK FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('ERROR-FREE/RESPONSIVE STATIC CHECK PASSED');
