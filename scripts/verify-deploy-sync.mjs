/**
 * RC1.4 — Verify production deployment metadata matches expected git commit.
 *
 * Usage:
 *   EXPECTED_GIT_COMMIT=$(git rev-parse HEAD) WILMS_API_URL=https://... npm run verify:deploy-sync
 *
 * Optional:
 *   WILMS_APP_URL — reserved for future Vercel commit parity checks
 */
function normalizeSha(value) {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function shaMatches(expected, actual) {
  const e = normalizeSha(expected);
  const a = normalizeSha(actual);
  if (!e || !a) {
    return false;
  }
  if (e === a) {
    return true;
  }
  return e.startsWith(a) || a.startsWith(e);
}

async function main() {
  const apiUrl = process.env.WILMS_API_URL?.replace(/\/$/, '');
  const expectedCommit =
    process.env.EXPECTED_GIT_COMMIT?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
    null;

  const checks = [];

  if (!apiUrl) {
    console.error('WILMS_API_URL is required');
    process.exit(1);
  }

  let health = null;
  try {
    const res = await fetch(`${apiUrl}/health`);
    const body = await res.json();
    health = body?.data ?? body;
    checks.push({
      name: '/health HTTP 200',
      pass: res.status === 200,
      detail: `http=${res.status}`,
    });
  } catch (error) {
    checks.push({
      name: '/health HTTP 200',
      pass: false,
      detail: error instanceof Error ? error.message : 'fetch failed',
    });
  }

  if (health) {
    checks.push({
      name: 'gitCommit present',
      pass: Boolean(health.gitCommit),
      detail: health.gitCommit ?? 'null',
    });

    checks.push({
      name: 'schema.status ok',
      pass: health.schema?.status === 'ok',
      detail: health.schema?.status ?? 'missing',
    });

    checks.push({
      name: 'migrations ok',
      pass:
        health.migrations?.status === 'ok' &&
        health.migrations?.applied === health.migrations?.expected,
      detail: `expected=${health.migrations?.expected ?? '?'} applied=${health.migrations?.applied ?? '?'} status=${health.migrations?.status ?? '?'}`,
    });

    if (expectedCommit) {
      checks.push({
        name: 'gitCommit matches expected',
        pass: shaMatches(expectedCommit, health.gitCommit),
        detail: `expected=${expectedCommit.slice(0, 12)}… actual=${String(health.gitCommit).slice(0, 12)}…`,
      });
    } else {
      checks.push({
        name: 'gitCommit matches expected',
        pass: true,
        detail: 'skipped (set EXPECTED_GIT_COMMIT or GITHUB_SHA)',
      });
    }

    const buildId = health.runtime?.buildId;
    const gitCommit = health.gitCommit;
    checks.push({
      name: 'buildId distinct from gitCommit',
      pass: !buildId || !gitCommit || normalizeSha(buildId) !== normalizeSha(gitCommit),
      detail: `buildId=${buildId ?? 'null'}`,
    });
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
    console.error('FAIL: deploy sync verification');
    process.exit(1);
  }

  console.log('PASS: deploy sync verification');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
