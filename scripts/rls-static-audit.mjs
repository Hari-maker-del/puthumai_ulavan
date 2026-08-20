import fs from 'node:fs';
import path from 'node:path';
const dir=path.join(process.cwd(),'supabase','migrations');
const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith('.sql')):[];
const text=files.map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n').toLowerCase();
const required=['enable row level security','auth.uid()'];
const missing=required.filter(x=>!text.includes(x));
if(missing.length){console.error('RLS STATIC AUDIT FAILED');missing.forEach(x=>console.error('- missing:',x));process.exit(1)}
console.log(`RLS STATIC AUDIT PASSED (${files.length} SQL migrations scanned)`);
