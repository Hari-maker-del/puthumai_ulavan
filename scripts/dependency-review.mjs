import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const rootLock = lock.packages?.[''] || {};
const findings = [];

const vite = lock.packages?.['node_modules/vite']?.version;
const esbuild = lock.packages?.['node_modules/esbuild']?.version;
const pluginReact = lock.packages?.['node_modules/@vitejs/plugin-react']?.version;
const tsEslint = lock.packages?.['node_modules/typescript-eslint']?.version;

if (vite && vite !== '5.4.21') {
  console.log(`Vite lockfile version: ${vite}`);
} else {
  console.log(`Vite lockfile version: ${vite || 'missing'}`);
}

console.log(`esbuild lockfile version: ${esbuild || 'missing'}`);
console.log(`@vitejs/plugin-react lockfile version: ${pluginReact || 'missing'}`);
console.log(`typescript-eslint lockfile version: ${tsEslint || 'missing'}`);

if (vite === '5.4.21') {
  console.log('Vite 5.4.21 includes the Windows dev-server security patch for CVE-2025-62522.');
}

if (esbuild && esbuild !== '0.21.5') {
  console.log('esbuild is no longer pinned to the previously audited 0.21.5 release.');
} else {
  findings.push(
    'esbuild is still locked to 0.21.5. Regenerate the lockfile with a current supported Vite/esbuild toolchain on a networked machine before release.'
  );
}

if (Object.keys(rootLock.devDependencies || {}).length === 0) {
  findings.push('package-lock root devDependency metadata is missing.');
}

if (findings.length) {
  console.warn('DEPENDENCY REVIEW: ACTION REQUIRED');
  findings.forEach(f => console.warn(`- ${f}`));
  console.warn('Run npm install/update on a networked development machine, then npm audit and npm run quality:final.');
  console.warn('Dependency review is non-blocking in this archive because the registry was unavailable during packaging.');
}

console.log('DEPENDENCY REVIEW: COMPLETE (see warnings above if any)');
