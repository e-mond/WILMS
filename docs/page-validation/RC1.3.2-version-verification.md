# RC1.3.2 — Version Synchronization

**Date:** 2026-07-02T22:45:00Z  
**Expected version:** `0.2.2`

---

## Summary

**Result: PASS** — All checked surfaces report **`0.2.2`**. Version string is consistent; **commit SHA is not** (see git/deployment reports).

---

## `npm run verify:version` output

```
✓ package.json: 0.2.2
✓ apps/frontend/package.json: 0.2.2
✓ apps/backend/package.json: 0.2.2
✓ CHANGELOG.md: contains [0.2.2]
✓ /health version: 0.2.2
✓ login page label: WILMS v0.2.2
PASS: all versions match 0.2.2
```

---

## Matrix

| Surface | Version | Match |
|---------|---------|-------|
| Root `package.json` | 0.2.2 | PASS |
| `@wilms/frontend` | 0.2.2 | PASS |
| `@wilms/api` | 0.2.2 | PASS |
| Railway `/health` | 0.2.2 | PASS |
| Login screen label | WILMS v0.2.2 | PASS |
| Git tag | v0.2.2 | PASS |
| Git tag v1.0.0 | — | Not present (expected) |
| GitHub Release | Not verified (gh auth unavailable) | PENDING |

Navbar/sidebar/footer/About: inherit from shared app version constants fed by `0.2.2` package version (same gate script covers login; full UI sweep deferred to functional audit).

---

## Pass gate

Version strings: **PASS**. Commit alignment: **FAIL** (separate gate).
