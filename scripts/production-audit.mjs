import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
  }
}

walk(path.join(root, 'src'));

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);

  if (/localhost:\d+|127\.0\.0\.1:\d+/.test(text)) {
    failures.push(`localhost fallback/reference in source: ${rel}`);
  }

  if (/from\s+['"][^'"]*(dummyData|mockData)['"]/.test(text)) {
    // Development mock loader is the only allowed source-level import.
    if (!rel.replaceAll('\\', '/').endsWith('src/services/mockData.ts')) {
      failures.push(`production mock-data import: ${rel}`);
    }
  }

  if (/import\s*\([^)]*(dummyData|mockData)/.test(text) &&
      !rel.replaceAll('\\', '/').endsWith('src/services/mockData.ts')) {
    failures.push(`production dynamic mock-data import: ${rel}`);
  }

  if (/return\s+mock[A-Za-z0-9_]*\s*\(/.test(text)) {
    failures.push(`mock return path: ${rel}`);
  }

  if (/fallback\s+mock/i.test(text)) {
    failures.push(`mock fallback path: ${rel}`);
  }
}

const weatherApi = path.join(root, 'api', 'weather.js');
if (!fs.existsSync(weatherApi)) {
  failures.push('missing production weather function: api/weather.js');
} else {
  const weatherText = fs.readFileSync(weatherApi, 'utf8');
  if (!weatherText.includes('process.env.OPENWEATHER_API_KEY')) {
    failures.push('weather function must read OPENWEATHER_API_KEY server-side');
  }
  if (!weatherText.includes('open-meteo.com')) {
    failures.push('weather function must retain a real-data fallback provider');
  }
}

const vercelConfig = path.join(root, 'vercel.json');
if (fs.existsSync(vercelConfig)) {
  const vercelText = fs.readFileSync(vercelConfig, 'utf8');
  if (!vercelText.includes('((?!api/)')) {
    failures.push('vercel SPA rewrite must exclude /api/* functions');
  }
}

const required = [
  'src/components/AppErrorBoundary.tsx',
  'src/components/RealDataEmptyState.tsx',
  'src/services/productionApiGuard.ts',
  'src/services/realtimeProduction.ts',
  'src/services/authFlowGuard.ts',
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing required file: ${file}`);
}

for (const file of ['.env', '.env.local', '.env.production', '.git', 'dist']) {
  if (fs.existsSync(path.join(root, file))) failures.push(`release artifact present: ${file}`);
}

if (failures.length) {
  console.error('PRODUCTION AUDIT FAILED');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log('PRODUCTION AUDIT PASSED');
