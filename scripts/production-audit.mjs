import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "vercel.json",
  "src/App.tsx",
  "src/services/productionValidationService.ts",
  "src/services/offlineSyncEngine.ts",
  "src/services/smartAlertEngine.ts",
  "src/services/aiTrustService.ts",
  "docs/PRODUCTION-CHECKLIST.md",
  "docs/SECURITY.md",
  "docs/ARCHITECTURE.md",
];

const forbidden = [".env", ".env.local", "node_modules", "dist", ".git"];
const failures = [];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

for (const dir of forbidden) {
  if (fs.existsSync(path.join(root, dir))) failures.push(`Forbidden release content present: ${dir}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const script of ["build", "lint", "typecheck"]) {
  if (!pkg.scripts?.[script]) failures.push(`Missing npm script: ${script}`);
}

const text = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (text.includes('"name": "vite-react-typescript-starter"')) {
  failures.push("Package name was not migrated from the starter template.");
}

const extraRequired = [
  'src/services/dataProvenanceService.ts',
  'src/services/aiDecisionService.ts',
  'src/services/farmOutcomeAnalyticsService.ts',
  'src/services/resilienceService.ts',
  'src/services/releaseHealthService.ts',
  'docs/PRODUCTION-QUALITY-GATE.md',
  'docs/DEMO-SCRIPT.md',
];
for (const file of extraRequired) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing production contract: ${file}`);
}

if (failures.length) {
  console.error("PRODUCTION AUDIT FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PRODUCTION AUDIT PASSED");
console.log("Run these next on a machine with npm:");
console.log("  npm ci");
console.log("  npm run typecheck");
console.log("  npm run lint");
console.log("  npm run build");
