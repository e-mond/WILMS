# RC1.3.2 — Git Verification

**Date:** 2026-07-02T22:45:00Z  
**Branch audited:** `main`  
**Auditor:** Automated RC1.3.2 gate run

---

## Summary

**Result: FAIL** — Production does not match GitHub `main`. RC1.3 is **not merged** to `main`.

---

## GitHub `main` state

| Item | Evidence |
|------|----------|
| HEAD SHA | `8a83278b906ba68172f5d7cd4846f7a8d01e1196` |
| Latest commit message | `Merge pull request #44 from e-mond/release/rc1-1-production-stabilization` |
| Prior merge | `1772727` — PR #43 (RC1.1 stabilization) |
| Package version | `0.2.2` (`package.json`, workspaces) |
| Git tags | `v0.2.0`, `v0.2.2` — **no `v1.0.0`** |
| GitHub CLI releases | Not queried (`gh` not authenticated) |

---

## RC1.3 merge status

| Item | Status |
|------|--------|
| `release/rc1-3-final-certification` | **Not merged** to `main` |
| Commits on RC1.3 branch not on `main` | `c036c4e`, `b1a41d2`, `6002b99` (3 commits) |
| RC1.3 UX / empty-state deliverables on `main` | **Absent** (`docs/page-validation/RC1.3-*.md` not present) |

**Conclusion:** The statement "RC1.3 merged" is **contradicted** by repository evidence. `main` reflects **RC1.2** (PR #44), not RC1.3.

---

## Production vs Git SHA

| Surface | Reported SHA / version | Matches `main` `8a83278`? |
|---------|------------------------|---------------------------|
| GitHub `main` | `8a83278` | — |
| Railway `/health` `gitCommit` | `cf3ce103d49a8b7c0d37a4dc813472461ef01895` | **NO** — predates RC1.1/RC1.2 merges |
| Vercel deployment SHA | Not exposed in HTTP headers (no `x-git-sha`) | **Unknown** |
| `verify:version` login label | `WILMS v0.2.2` | Version only — not commit |

---

## CHANGELOG

| Section | Present on `main` |
|---------|-----------------|
| `[0.2.2]` | Yes |
| RC1.2 unreleased notes | Yes |
| RC1.3 notes | **No** (RC1.3 not merged) |
| `[1.0.0]` | **No** |

---

## Pass gate

Production must be built from the latest merged commit on `main` (or explicitly tagged release). **Current Railway deploy reports `cf3ce10` — STOP.**
