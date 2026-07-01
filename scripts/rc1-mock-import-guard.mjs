#!/usr/bin/env node
/**
 * RC1.1 — Fail CI if production feature code imports mock services or demo datasets.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const FEATURES_DIR = join(ROOT, 'apps/frontend/src/features');
const FORBIDDEN_PATTERNS = [
  { pattern: /@\/services\/mock/, label: 'mock service import' },
  { pattern: /from ['"]@\/mocks\//, label: 'mocks import' },
  { pattern: /DASHBOARD_DEMO/, label: 'DASHBOARD_DEMO reference' },
  { pattern: /getDashboardDemoDataset/, label: 'demo dataset factory' },
];

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry)) {
      continue;
    }
    const content = readFileSync(full, 'utf8');
    for (const { pattern, label } of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        violations.push({ file: relative(ROOT, full), label });
      }
    }
  }
}

walk(FEATURES_DIR);

console.log('RC1.1 Mock Import Guard');
if (violations.length === 0) {
  console.log('PASS: no forbidden mock imports in features/');
  process.exit(0);
}

console.log(`FAIL: ${violations.length} violation(s)`);
for (const v of violations) {
  console.log(`  - ${v.file}: ${v.label}`);
}
process.exit(1);
