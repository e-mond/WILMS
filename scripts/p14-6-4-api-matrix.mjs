#!/usr/bin/env node
/**
 * P14.6.4 — Frontend apiClient paths vs backend Express routes.
 * Exit 0 when every frontend path matches a backend route pattern.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const servicesDir = join(root, 'apps/frontend/src/services');
const modulesDir = join(root, 'apps/backend/src/modules');

const API_CALL_RE =
  /apiClient\.(get|post|patch|put|delete)(?:<[^>]*>)?\(\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")/g;
const ROUTE_RE =
  /\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`]/g;

function walkTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'mock' || entry === 'node_modules') continue;
      out.push(...walkTsFiles(full));
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
  for (const file of walkTsFiles(servicesDir)) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('apiClient')) continue;
    const rel = relative(root, file).replace(/\\/g, '/');
    for (const re of [API_CALL_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const line = text.slice(0, m.index).split('\n').length;
        const path = m[2] ?? m[3] ?? m[4] ?? '';
        calls.push({ method: m[1].toUpperCase(), path: normalizePath(path), file: rel, line });
      }
    }
  }
  return calls;
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
    let m;
    ROUTE_RE.lastIndex = 0;
    while ((m = ROUTE_RE.exec(text)) !== null) {
      routes.push({ method: m[1].toUpperCase(), path: m[2], file: rel });
    }
  }
  return routes;
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
  return routes.find(
    (r) => r.method === call.method && pathMatches(pathOnly, r.path),
  );
}

const calls = collectFrontendCalls();
const routes = collectBackendRoutes();
const missing = [];
const ok = [];

for (const call of calls) {
  const match = findMatch(call, routes);
  if (match) {
    ok.push({ ...call, backend: `${match.file} ${match.method} ${match.path}` });
  } else {
    missing.push(call);
  }
}

console.log(`Frontend apiClient calls: ${calls.length}`);
console.log(`Backend routes: ${routes.length}`);
console.log(`Matched: ${ok.length}`);
console.log(`Missing backend: ${missing.length}`);

if (missing.length > 0) {
  console.log('\nMissing backend routes:');
  for (const m of missing) {
    console.log(`  ${m.method} ${m.path} — ${m.file}:${m.line}`);
  }
  process.exit(1);
}

console.log('\nPASS: all frontend apiClient paths have backend routes');
process.exit(0);
