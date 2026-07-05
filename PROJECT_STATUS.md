# WILMS - Project Status

**Last updated:** 2026-07-05 (v1.1.1 released)  
**Package version:** `1.1.1`  
**Branch:** `main` @ `e13af37`  
**Tag:** `v1.1.1` ? `e13af37`  
**Production (Railway API):** `d2a64bb` ? redeploy pending (migration 0013 not applied yet)  
**Production (Vercel UI):** `v1.1.1` on login page

---

## Summary

v1.1.1 is **merged to main**, **tagged**, and **pushed**. Local repo is synced on `main` with a clean working tree. Production smoke **32/32** and RBAC **11/11** pass on the current live API. Railway must redeploy from `main`/`v1.1.1` to apply hotfix backend (migration `0013`, disburse IDs, audit fixes).

---

## Verification status

| Check | Result |
|-------|--------|
| Merge PR #53 ? `main` | **Done** (`e13af37`) |
| Tag `v1.1.1` pushed | **Done** |
| Local sync (`main`, clean) | **Done** |
| `verify:deploy-sync` vs `e13af37` | **Pending** ? API still `d2a64bb` |
| Railway `/health` | PASS (200, DB, Cloudinary, 13/13 migrations) |
| Vercel login + BFF | PASS (`WILMS v1.1.1`) |
| `smoke:production` | **32/32** |
| `smoke:rbac` | **11/11** |

See [V1.1.1_HOTFIX_REPORT.md](./V1.1.1_HOTFIX_REPORT.md) and [POST_RELEASE_VERIFICATION.md](./POST_RELEASE_VERIFICATION.md).

---

## After Railway redeploy

1. Re-run `verify:deploy-sync` with `EXPECTED_GIT_COMMIT=e13af37`
2. Confirm migrations **14/14** and `gitCommit` matches tag
3. Manual UX pass for hotfixes (registration, disburse, `DIS-*` IDs, audit labels)

---

## Ready for v1.2

Repository root decluttered, archives organized, v1.1.1 gate complete pending Railway deploy sync.
