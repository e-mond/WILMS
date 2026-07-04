#!/usr/bin/env node
/**
 * Remove local-only build artifacts and caches. Safe to run anytime.
 * Does not delete node_modules, .env files, or source code.
 */
import { rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

const targets = [
  'apps/frontend/.next',
  'apps/frontend/test-results',
  'apps/backend/.wilms-uploads',
  '.turbo',
];

function removeTsBuildInfo(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      removeTsBuildInfo(full);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.tsbuildinfo')) {
      rmSync(full, { force: true });
      console.log(`removed ${full}`);
    }
  }
}

let freed = 0;

for (const relative of targets) {
  const full = join(root, relative);
  if (!existsSync(full)) {
    continue;
  }

  const size = dirSize(full);
  rmSync(full, { recursive: true, force: true });
  freed += size;
  console.log(`removed ${relative} (${formatMb(size)})`);
}

removeTsBuildInfo(root);
console.log(`\nDone. Approximate space reclaimed: ${formatMb(freed)}`);

function dirSize(path) {
  let total = 0;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += statSync(full).size;
    }
  }
  return total;
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
