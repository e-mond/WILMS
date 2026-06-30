/**
 * P14.6 Objective 18 — verify version string consistency at deploy time.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(root, relPath), 'utf8'));
}

function readVersion() {
  return readJson('package.json').version;
}

async function main() {
  const expected = readVersion();
  const label = `WILMS v${expected}`;
  const apiUrl = process.env.WILMS_API_URL?.replace(/\/$/, '');
  const appUrl = process.env.WILMS_APP_URL?.replace(/\/$/, '');

  const checks = [];

  for (const pkg of ['package.json', 'apps/frontend/package.json', 'apps/backend/package.json']) {
    const version = readJson(pkg).version;
    checks.push({ name: pkg, pass: version === expected, detail: version });
  }

  const changelog = readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  checks.push({
    name: 'CHANGELOG.md',
    pass: changelog.includes(`[${expected}]`),
    detail: `contains [${expected}]`,
  });

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/health`);
      const body = await res.json();
      const version = body?.data?.version ?? body?.version;
      checks.push({
        name: '/health version',
        pass: version === expected,
        detail: String(version),
      });
    } catch (error) {
      checks.push({
        name: '/health version',
        pass: false,
        detail: error instanceof Error ? error.message : 'fetch failed',
      });
    }
  }

  if (appUrl) {
    try {
      const html = await (await fetch(`${appUrl}/login`)).text();
      checks.push({
        name: 'login page label',
        pass: html.includes(label),
        detail: label,
      });
    } catch (error) {
      checks.push({
        name: 'login page label',
        pass: false,
        detail: error instanceof Error ? error.message : 'fetch failed',
      });
    }
  }

  let failed = false;
  for (const check of checks) {
    const mark = check.pass ? '✓' : '✗';
    console.log(`  ${mark} ${check.name}: ${check.detail}`);
    if (!check.pass) {
      failed = true;
    }
  }

  if (failed) {
    console.error('FAIL: version consistency check');
    process.exit(1);
  }

  console.log(`PASS: all versions match ${expected}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
