import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const professional = readFileSync(new URL('../src/pages/ProfessionalPage.tsx', import.meta.url), 'utf8');
const failures = [];

const configuredPaths = new Set(
  [...professional.matchAll(/^\s*'([^']+)':\s*\{/gm)].map((match) => match[1]),
);
const professionalRoutes = [...app.matchAll(/<Route path="([^"]+)" element={<ProfessionalPage\s*\/>} \/>/g)]
  .map((match) => match[1]);
const unconfigured = professionalRoutes.filter((path) => !configuredPaths.has(path));

if (unconfigured.length) {
  failures.push(`Professional routes missing page content: ${unconfigured.join(', ')}`);
}
if (!app.includes('<Route path="*" element={<NotFoundPage />} />')) {
  failures.push('Unknown routes must render the dedicated NotFoundPage.');
}
for (const code of ['400', '401', '403', '404', '408', '429', '500', '502', '503', '504']) {
  if (!professionalRoutes.includes(`/${code}`) || !configuredPaths.has(`/${code}`)) {
    failures.push(`HTTP error page /${code} is missing a route or page configuration.`);
  }
}

console.log(`Page route audit: ${professionalRoutes.length} informational/system routes, ${configuredPaths.size} page configurations.`);
console.log(`HTTP error destinations checked: 10. Unknown-route 404: ${app.includes('<Route path="*" element={<NotFoundPage />} />') ? 'configured' : 'MISSING'}.`);
if (failures.length) {
  console.error('\nFAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('PASS: all ProfessionalPage routes have matching content and required error destinations.');
}
