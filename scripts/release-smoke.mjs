import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["package.json", "package metadata"],
  ["package-lock.json", "lockfile"],
  ["src/services/farmOutcomeLearningService.ts", "outcome learning"],
  ["src/services/farmDigitalTwinService.ts", "digital twin"],
  ["src/services/offlineConflictService.ts", "offline conflict"],
  ["src/pages/app/FarmOutcomePage.tsx", "outcome UI"],
  ["docs/GOD-LEVEL-ARCHITECTURE.md", "architecture"],
];
let failed = false;
for (const [file, label] of checks) {
  const ok = fs.existsSync(path.join(root, file));
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  failed ||= !ok;
}
if (fs.existsSync(path.join(root, ".env")) || fs.existsSync(path.join(root, ".env.local"))) {
  console.error("FAIL  environment secret file present");
  failed = true;
}
process.exit(failed ? 1 : 0);
