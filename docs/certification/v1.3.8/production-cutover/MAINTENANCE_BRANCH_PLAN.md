# Maintenance Branch Plan — WILMS v1.3.8

**Date:** 17 July 2026  
**Phase:** 23  
**Status:** **NOT EXECUTED** — post-certification procedure only

---

## Preconditions (mandatory)

**Do not run any command in this document until ALL of the following are true:**

| # | Precondition | Status |
|---|--------------|--------|
| 1 | Every **Pending** row in [PRODUCTION_ACCEPTANCE_CHECKLIST.md](./PRODUCTION_ACCEPTANCE_CHECKLIST.md) is **Complete** with evidence | **Pending** |
| 2 | [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md) status updated to **ISSUED** | **Pending** — currently **NOT ISSUED** |
| 3 | Human signatures collected in [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | **Pending** |
| 4 | Authenticated smoke logs attached | **Pending** |
| 5 | Neon restore drill evidence attached | **Pending** |
| 6 | Live financial reconcile evidence attached | **Pending** |

**Current state:**

- Tag `v1.3.8-production-certified` — **NOT CREATED**
- Maintenance branch — **NOT CREATED**
- Cutover decision — **⚠ READY WITH CONDITIONS**

---

## Purpose

After full production certification, create:

1. An annotated Git tag marking the certified production release.
2. A long-lived maintenance branch for hotfixes against the certified line.

This isolates production patches from ongoing `main` development.

---

## Target artifacts (after certification)

| Artifact | Name |
|----------|------|
| Git tag | `v1.3.8-production-certified` |
| Maintenance branch | `maintenance/v1.3.8` (or team convention) |
| Certified commit | `866d72ed0fb417f9dd05d87956a9c564a80f9c85` (verify at execution time) |

---

## Commands — run ONLY after ✅ certification

**Step 1 — Verify clean tree and correct commit**

```bash
git fetch origin
git checkout main
git pull origin main
git rev-parse HEAD
# Expect: 866d72ed0fb417f9dd05d87956a9c564a80f9c85 (or newer if hotfixes merged pre-tag)
```

**Step 2 — Final verification gates**

```bash
npm run type-check
npm run test -w @wilms/api
npm run verify:version
# Operator: npm run smoke:production with WILMS_SMOKE_* set
```

**Step 3 — Create annotated certification tag**

```bash
git tag -a v1.3.8-production-certified -m "WILMS v1.3.8 production certified"
git push origin v1.3.8-production-certified
```

**Step 4 — Create maintenance branch from tagged commit**

```bash
git checkout -b maintenance/v1.3.8 v1.3.8-production-certified
git push -u origin maintenance/v1.3.8
```

**Step 5 — GitHub Release (operator)**

- Create release from tag `v1.3.8-production-certified`
- Attach link to `docs/certification/v1.3.8/production-cutover/` pack
- Note certified commit SHA and deploy timestamps

**Step 6 — Update documentation**

- Set [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md) to **ISSUED**
- Update [INDEX.md](./INDEX.md) gate table
- Archive evidence with certification timestamp

---

## Hotfix workflow (post branch creation)

```bash
git checkout maintenance/v1.3.8
# cherry-pick or commit hotfix
git tag -a v1.3.8.1-production-certified -m "WILMS v1.3.8.1 production hotfix"
git push origin maintenance/v1.3.8 --tags
# Deploy via standard Railway/Vercel pipeline
```

---

## What was NOT done in Phase 23

| Action | Status |
|--------|--------|
| `git tag v1.3.8-production-certified` | **NOT CREATED** |
| `git checkout -b maintenance/v1.3.8` | **NOT CREATED** |
| GitHub Release from certified tag | **NOT CREATED** |

This is intentional. Certification conditions remain open.

---

## Path reminder

**✅ WILMS v1.3.8 Production Certified** = complete Pending checklist with real evidence → issue certificate → **then** execute this plan.
