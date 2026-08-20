import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/services/realtimeService.ts',
  'src/hooks/useRealtimeTable.ts',
  'src/hooks/useRealtimeDashboard.ts',
  'src/components/dashboard/DashboardLayout.tsx',
  'supabase/migrations/realtime_tables.sql',
  'docs/REALTIME-5.0.md',
];
const missing = required.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('REALTIME CHECK FAILED');
  missing.forEach(file => console.error(`Missing: ${file}`));
  process.exit(1);
}
const hook = fs.readFileSync(path.join(root, 'src/hooks/useRealtimeDashboard.ts'), 'utf8');
for (const table of ['farms','expenses','crops','farmer_alerts','recommendations','market_prices']) {
  if (!hook.includes(`table: '${table}'`)) {
    console.error(`REALTIME CHECK FAILED: ${table} subscription missing`);
    process.exit(1);
  }
}
console.log('REALTIME STATIC CHECK PASSED');
console.log('Six realtime data channels are wired into the authenticated dashboard.');
console.log('Live Supabase/Vercel/two-device verification still requires the real project.');
