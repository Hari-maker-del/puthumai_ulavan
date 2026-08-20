import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), src=path.join(root,'src'), failures=[];
const files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git','dist'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx|js|jsx)$/.test(e.name))files.push(p)}}
walk(src);
for(const f of files){
 const t=fs.readFileSync(f,'utf8'), r=path.relative(root,f).replaceAll('\\','/');
 if(/from\s+['"][^'"]*dummyData['"]/.test(t) && !r.endsWith('src/services/mockData.ts')) failures.push(`dummyData import: ${r}`);
 if(/from\s+['"][^'"]*mockData['"]/.test(t) && !r.endsWith('src/services/mockData.ts')) failures.push(`mockData import: ${r}`);
 if(/localhost:\d+|127\.0\.0\.1:\d+/.test(t)) failures.push(`localhost: ${r}`);
}
if(failures.length){console.error('REAL-DATA AUDIT FAILED'); failures.forEach(x=>console.error('- '+x)); process.exit(1)}
console.log('REAL-DATA AUDIT PASSED');
