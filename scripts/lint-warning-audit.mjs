import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const hits = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['node_modules','.git','dist'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
      const t = fs.readFileSync(p,'utf8');
      if (/react-hooks\/exhaustive-deps/.test(t)) hits.push(path.relative(root,p));
    }
  }
}
walk(path.join(root,'src'));
console.log(`Files with explicit exhaustive-deps decisions: ${hits.length}`);
for (const h of hits) console.log(`- ${h}`);
