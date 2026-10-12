import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const robotsPath = path.join(root, 'public/robots.txt');
const sitemapPath = path.join(root, 'public/sitemap.xml');

for (const file of ['src/components/RouteSEO.tsx', 'public/robots.txt', 'public/sitemap.xml']) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required SEO file: ${file}`);
}

if (failures.length) {
  console.error('SEO AUDIT: FAILED');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}

const robots = read('public/robots.txt');
const sitemap = read('public/sitemap.xml');
const routeSeo = read('src/components/RouteSEO.tsx');
const app = read('src/App.tsx');
const index = read('index.html');
const urls = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
const paths = urls.map((url) => new URL(url).pathname);
const requiredPaths = ['/', '/pages', '/about', '/features', '/faq', '/help', '/contact', '/privacy', '/terms', '/accessibility'];

if (!robots.includes('Sitemap: https://puthumai-ulavan.vercel.app/sitemap.xml')) failures.push('robots.txt must point to the production sitemap.');
if (!sitemap.includes('<urlset') || !sitemap.includes('</urlset>')) failures.push('sitemap.xml must have a valid urlset wrapper.');
if (urls.length < 15) failures.push('Sitemap should contain at least 15 curated public URLs.');
for (const route of requiredPaths) if (!paths.includes(route)) failures.push(`Sitemap is missing required public route: ${route}`);
for (const route of paths) if (!routeSeo.includes(`'${route}'`)) failures.push(`Sitemap route has no explicit SEO metadata: ${route}`);
if (!app.includes('<RouteSEO />')) failures.push('RouteSEO must be mounted inside BrowserRouter.');
if (!routeSeo.includes("'noindex, nofollow'") || !routeSeo.includes("'index, follow'")) failures.push('RouteSEO must distinguish indexable public pages from private/unreviewed routes.');
if (!index.includes('<link rel="canonical"')) failures.push('index.html should declare a canonical homepage URL.');
if (!index.includes('name="description"')) failures.push('index.html should include a meta description.');
if (paths.some((route) => route.startsWith('/dashboard') || ['/login', '/signup', '/reset-password'].includes(route))) failures.push('Sitemap must not include private dashboard or authentication routes.');

if (failures.length) {
  console.error('SEO AUDIT: FAILED');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}

console.log(`SEO AUDIT: PASSED — ${urls.length} curated public URLs, robots.txt, canonical metadata and private-route noindex controls checked.`);
