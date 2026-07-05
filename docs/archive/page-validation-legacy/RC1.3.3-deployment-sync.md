# RC1.3.3 ÔÇö Deployment Sync

| Surface | SHA (2026-07-02) | Target |
|---------|------------------|--------|
| GitHub `main` | post-merge RC1.3.3 | source of truth |
| Railway `gitCommit` | `cf3ce10` | **must match main HEAD** |
| Vercel | unknown | **must match main HEAD** |

**Fix implemented:** `env.gitCommit` reads `RAILWAY_GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_SHA` when `WILMS_GIT_COMMIT` unset.

**Ops:** Trigger redeploy from `main` on both platforms; verify `/health.gitCommit === git rev-parse HEAD`.
