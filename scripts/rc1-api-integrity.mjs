#!/usr/bin/env node
/**
 * P14.RC1 — Static API integrity: frontend apiClient paths vs backend Express routes,
 * plus orphan route detection.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const frontendSrc = join(root, 'apps/frontend/src');
const servicesDir = join(frontendSrc, 'services');
const featuresDir = join(frontendSrc, 'features');
const hooksDir = join(frontendSrc, 'hooks');
const modulesDir = join(root, 'apps/backend/src/modules');
const appDir = join(frontendSrc, 'app');

const API_CALL_RE =
  /apiClient\.(get|post|patch|put|delete)(?:<[^>]*>)?\(\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")/g;
const FETCH_CALL_RE =
  /fetch\(\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")/g;
const ROUTE_RE =
  /\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`]/g;

function walkTsFiles(dir, skip = ['mock', 'node_modules']) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (skip.includes(entry)) continue;
      out.push(...walkTsFiles(full, skip));
      continue;
    }
    if (entry.endsWith('.ts') && !entry.endsWith('.mock.ts')) {
      out.push(full);
    }
  }
  return out;
}

function collectFrontendCalls() {
  const calls = [];
  const scanDirs = [
    { dir: servicesDir, inferMethod: null },
    { dir: featuresDir, inferMethod: null },
    { dir: hooksDir, inferMethod: null },
  ];

  for (const { dir, inferMethod } of scanDirs) {
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      const rel = relative(root, file).replace(/\\/g, '/');
      API_CALL_RE.lastIndex = 0;
      let m;
      while ((m = API_CALL_RE.exec(text)) !== null) {
        const line = text.slice(0, m.index).split('\n').length;
        const path = m[2] ?? m[3] ?? m[4] ?? '';
        calls.push({ method: m[1].toUpperCase(), path: normalizePath(path), file: rel, line });
      }

      if (!text.includes('fetch(')) {
        continue;
      }

      FETCH_CALL_RE.lastIndex = 0;
      while ((m = FETCH_CALL_RE.exec(text)) !== null) {
        const rawPath = m[1] ?? m[2] ?? m[3] ?? '';
        if (!rawPath.startsWith('/') || rawPath.startsWith('/api/wilms') || rawPath.startsWith('/api/auth')) {
          continue;
        }
        const line = text.slice(0, m.index).split('\n').length;
        const method = inferMethod ?? inferFetchMethod(text, m.index);
        calls.push({
          method,
          path: normalizePath(rawPath),
          file: rel,
          line,
        });
      }
    }
  }

  return calls;
}

function inferFetchMethod(text, index) {
  const window = text.slice(Math.max(0, index - 80), index + 120);
  if (/method:\s*['"`]POST['"`]/i.test(window)) return 'POST';
  if (/method:\s*['"`]PATCH['"`]/i.test(window)) return 'PATCH';
  if (/method:\s*['"`]PUT['"`]/i.test(window)) return 'PUT';
  if (/method:\s*['"`]DELETE['"`]/i.test(window)) return 'DELETE';
  return 'GET';
}

function collectBackendRoutes() {
  const routes = [];
  for (const mod of readdirSync(modulesDir)) {
    const routesFile = join(modulesDir, mod, 'routes.ts');
    try {
      readFileSync(routesFile);
    } catch {
      continue;
    }
    const text = readFileSync(routesFile, 'utf8');
    const rel = relative(root, routesFile).replace(/\\/g, '/');
    ROUTE_RE.lastIndex = 0;
    let m;
    while ((m = ROUTE_RE.exec(text)) !== null) {
      routes.push({ method: m[1].toUpperCase(), path: m[2], file: rel, module: mod });
    }
  }
  return routes;
}

function collectAppPages() {
  const pages = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (entry === 'page.tsx') {
        pages.push(relative(appDir, full).replace(/\\/g, '/').replace(/\/page\.tsx$/, ''));
      }
    }
  }
  walk(appDir);
  return pages;
}

function normalizePath(p) {
  let s = p.replace(/\$\{query\}/g, '');
  s = s.replace(/\$\{[a-zA-Z0-9_.]+\}/g, ':param');
  s = s.replace(/\$\{[\s\S]*$/g, '');
  return s.split('?')[0].replace(/\/$/, '') || s;
}

function splitSegments(path) {
  return normalizePath(path)
    .split('/')
    .filter(Boolean)
    .map((seg) => (seg.endsWith(':param') && !seg.startsWith(':') ? seg.slice(0, -':param'.length) : seg));
}

function pathMatches(frontPath, backPath) {
  let f = splitSegments(frontPath);
  let b = splitSegments(backPath);
  while (f.length > b.length && f[f.length - 1] === ':param') {
    f = f.slice(0, -1);
  }
  if (f.length === b.length) {
    return f.every((seg, i) => seg === b[i] || b[i] === ':param' || b[i].startsWith(':'));
  }
  if (f.length < b.length && b.slice(f.length).every((seg) => seg.startsWith(':'))) {
    return f.every((seg, i) => seg === b[i] || b[i] === ':param' || b[i].startsWith(':'));
  }
  return false;
}

function findMatch(call, routes) {
  const pathOnly = call.path.split('?')[0];
  return routes.find((r) => r.method === call.method && pathMatches(pathOnly, r.path));
}

const calls = collectFrontendCalls();
const routes = collectBackendRoutes();
const pages = collectAppPages();
const missing = [];
const ok = [];
const consumedBackend = new Set();

for (const call of calls) {
  const match = findMatch(call, routes);
  if (match) {
    ok.push({ ...call, backend: `${match.file} ${match.method} ${match.path}` });
    consumedBackend.add(`${match.method} ${match.path}`);
  } else {
    missing.push(call);
  }
}

const orphanRoutes = routes.filter(
  (route) =>
    !consumedBackend.has(`${route.method} ${route.path}`) &&
    route.path !== '/health' &&
    !route.path.startsWith('/auth'),
);

console.log('RC1 API Integrity (static)');
console.log(`Frontend apiClient calls: ${calls.length}`);
console.log(`Backend routes: ${routes.length}`);
console.log(`Matched: ${ok.length}`);
console.log(`Missing backend: ${missing.length}`);
console.log(`Orphan backend routes: ${orphanRoutes.length}`);
console.log(`Next.js pages: ${pages.length}`);

if (missing.length > 0) {
  console.log('\nMissing backend routes:');
  for (const m of missing) {
    console.log(`  ${m.method} ${m.path} — ${m.file}:${m.line}`);
  }
  process.exit(1);
}

if (orphanRoutes.length > 0) {
  console.log('\nOrphan backend routes (document if intentional):');
  for (const route of orphanRoutes.slice(0, 20)) {
    console.log(`  ${route.method} ${route.path} — ${route.module}`);
  }
}

console.log('\nPASS: all frontend apiClient paths have backend routes');
process.exit(0);
