/**
 * P14.6 — Performance budget gate (CI-enforceable metrics).
 * Lighthouse Web Vitals run separately in deploy-staging workflow when URL is available.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runBundleCheck() {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/bundle-budget-check.mjs')], {
    stdio: 'inherit',
    cwd: root,
  });
  return result.status === 0;
}

function checkBuildExists() {
  const buildManifest = path.join(root, 'apps/frontend/.next/BUILD_ID');
  if (!readFileSync(buildManifest, { encoding: 'utf8', flag: 'r' })) {
    return false;
  }
  return true;
}

async function main() {
  if (!checkBuildExists()) {
    console.error('FAIL: apps/frontend/.next/BUILD_ID missing — run npm run build first.');
    process.exit(1);
  }

  const bundleOk = runBundleCheck();
  if (!bundleOk) {
    process.exit(1);
  }

  console.log('PASS: perf-budget-check (bundle budgets; Lighthouse runs on staging deploy)');
}

main();
