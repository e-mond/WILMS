#!/usr/bin/env node
/**
 * RC1 Phase 2 — API coverage: placeholder scan + integrity cross-check.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const frontendSrc = join(root, 'apps/frontend/src');
const featuresDir = join(frontendSrc, 'features');
const docsDir = join(root, 'docs/generated');

const PLACEHOLDER_RE =
  /not yet available|coming soon|placeholder implementation|TODO endpoint/i;
const SKIP_DIRS = new Set(['mock', 'mocks', 'tests', 'node_modules']);

function walkFiles(dir, ext = ['.ts', '.tsx']) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...walkFiles(full, ext));
      continue;
    }
    if (ext.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function scanPlaceholders() {
  const hits = [];
  for (const file of walkFiles(frontendSrc)) {
    const rel = relative(root, file).replace(/\\/g, '/');
    if (rel.includes('/services/mock/') || rel.includes('/mocks/')) continue;
    const text = readFileSync(file, 'utf8');
    if (!PLACEHOLDER_RE.test(text)) continue;
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (PLACEHOLDER_RE.test(line)) {
        hits.push({ file: rel, line: i + 1, snippet: line.trim().slice(0, 120) });
      }
    });
  }
  return hits;
}

function collectPages() {
  const appDir = join(frontendSrc, 'app');
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

const placeholders = scanPlaceholders();
const pages = collectPages();

const integrity = spawnSync('node', ['scripts/rc1-api-integrity.mjs'], {
  cwd: root,
  encoding: 'utf8',
});

const report = [
  '# RC1 API Coverage',
  '',
  `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
  '',
  '## Summary',
  '',
  `| Metric | Count |`,
  `|--------|-------|`,
  `| Next.js pages | ${pages.length} |`,
  `| Placeholder UI hits | ${placeholders.length} |`,
  `| API integrity | ${integrity.status === 0 ? 'PASS' : 'FAIL'} |`,
  '',
  '## Placeholder scan',
  '',
];

if (placeholders.length === 0) {
  report.push('No placeholder strings detected in production frontend code.');
} else {
  report.push('| File | Line | Snippet | Status |');
  report.push('|------|------|---------|--------|');
  for (const hit of placeholders) {
    report.push(`| \`${hit.file}\` | ${hit.line} | ${hit.snippet.replace(/\|/g, '\\|')} | Missing |`);
  }
}

report.push('', '## Page inventory', '', '| Page route |', '|------------|');
for (const page of pages.sort()) {
  report.push(`| \`/${page}\` |`);
}

report.push('', '## API integrity output', '', '```', integrity.stdout.trim(), '```');

mkdirSync(docsDir, { recursive: true });
writeFileSync(join(docsDir, 'RC1-api-coverage.md'), report.join('\n') + '\n');

console.log('RC1 API Coverage');
console.log(`Pages: ${pages.length}`);
console.log(`Placeholder hits: ${placeholders.length}`);

if (integrity.status !== 0) {
  console.error(integrity.stdout);
  console.error(integrity.stderr);
  process.exit(1);
}

if (placeholders.length > 0) {
  console.log('\nPlaceholder UI (must fix or hide):');
  for (const hit of placeholders) {
    console.log(`  ${hit.file}:${hit.line}`);
  }
  process.exit(1);
}

console.log('\nPASS: API coverage gate');
process.exit(0);
