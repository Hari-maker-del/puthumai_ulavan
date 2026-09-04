import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) files.push(p);
  }
}
walk(root);
const ignore = new Set(['className','id','type','name','href','src','viewBox','d','key','code','role','aria-hidden']);
const findings=[];
for (const file of files) {
  const text=fs.readFileSync(file,'utf8');
  const lines=text.split(/\r?\n/);
  lines.forEach((line,i)=>{
    if (/^\s*(\/\/|\*)/.test(line)) return;
    // JSX text and common string literals containing natural-language words.
    if (/>[^<{]*[A-Za-z]{3,}[^<{]*</.test(line) || /(['\"])[A-Za-z][A-Za-z ]{2,}\1/.test(line)) {
      if (!/import .*useI18n|from ['\"]/.test(line)) findings.push(`${path.relative(process.cwd(),file)}:${i+1}`);
    }
  });
}
console.log(`i18n audit scanned ${files.length} source files.`);
console.log(`Potential hard-coded user-facing lines: ${findings.length}`);
if (findings.length) console.log(findings.slice(0,80).join('\n'));
