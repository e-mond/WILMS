#!/usr/bin/env node
/**
 * Read-only P14.3C inventory extractor — does not modify application code.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'docs/generated/phase-3c-evidence');

function walk(dir, pred) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full, pred));
    else if (pred(full)) results.push(full);
  }
  return results;
}

// Pages
const pages = walk(path.join(root, 'apps/frontend/src/app'), (f) => f.endsWith('page.tsx'));
const pageRoutes = pages.map((f) => {
  const rel = f.replace(path.join(root, 'apps/frontend/src/app'), '').replace(/\\/g, '/');
  const route = rel.replace(/\/page\.tsx$/, '').replace(/\([^)]+\)/g, '') || '/';
  return { file: rel, route: route === '' ? '/' : route };
});

// API client paths from frontend services
const serviceFiles = walk(path.join(root, 'apps/frontend/src/services'), (f) =>
  f.endsWith('.ts') && !f.includes(`${path.sep}mock${path.sep}`) && !f.includes('index.'),
);
const apiPaths = new Set();
const apiPathRe = /apiClient\.(get|post|patch|put|delete)\(\s*[`'"]([^`'"]+)/g;
for (const file of serviceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = apiPathRe.exec(text))) {
    apiPaths.add(m[2].split('?')[0].replace(/\$\{[^}]+\}/g, ':param'));
  }
}

// Backend route paths
const routeFiles = walk(path.join(root, 'apps/backend/src/modules'), (f) => f.endsWith('routes.ts'));
const endpoints = [];
const routeRe = /Router\.(get|post|patch|put|delete)\(\s*\n?\s*['"`]([^'"`]+)/g;
for (const file of routeFiles) {
  const mod = path.basename(path.dirname(file));
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = routeRe.exec(text))) {
    endpoints.push({ module: mod, method: m[1].toUpperCase(), path: m[2] });
  }
}

// Schema tables
const schemaDir = path.join(root, 'apps/backend/src/db/schema');
const tables = [];
for (const file of fs.readdirSync(schemaDir)) {
  if (!file.endsWith('.ts') || file === 'index.ts' || file === 'enums.ts') continue;
  const text = fs.readFileSync(path.join(schemaDir, file), 'utf8');
  const pgTableRe = /pgTable\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = pgTableRe.exec(text))) tables.push(m[1]);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'inventory-extract.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      head: process.env.GIT_HEAD ?? 'unknown',
      pageCount: pageRoutes.length,
      pages: pageRoutes.sort((a, b) => a.route.localeCompare(b.route)),
      endpointCount: endpoints.length,
      endpoints: endpoints.sort((a, b) => a.path.localeCompare(b.path)),
      frontendApiPathCount: apiPaths.size,
      frontendApiPaths: [...apiPaths].sort(),
      tableCount: tables.length,
      tables: tables.sort(),
    },
    null,
    2,
  ),
);

console.log(
  `pages=${pageRoutes.length} endpoints=${endpoints.length} frontendPaths=${apiPaths.size} tables=${tables.length}`,
);
