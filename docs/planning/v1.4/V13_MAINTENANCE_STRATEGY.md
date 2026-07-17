# v1.3.x Maintenance Strategy — Phase 24.1

**Date:** 17 July 2026  
**Applies to:** WILMS v1.3.8 production line  
**Status:** **Policy defined; maintenance branch NOT created until production certified**

---

## Current state

| Artifact | Status |
|----------|--------|
| v1.3.8 application software | **Complete** — engineering sign-off |
| Production certification (`FINAL_PRODUCTION_CERTIFICATE.md`) | **NOT ISSUED** — operator evidence pending |
| Tag `v1.3.8-production-certified` | **NOT CREATED** |
| Branch `maintenance/v1.3.8` | **NOT CREATED** |

**Rule:** No maintenance branch, no production-certified tag, and no hotfix releases against a frozen line until every precondition in [`MAINTENANCE_BRANCH_PLAN.md`](../../certification/v1.3.8/production-cutover/MAINTENANCE_BRANCH_PLAN.md) is satisfied.

---

## Supported versions

| Version line | Support class | End of support | Notes |
|--------------|---------------|----------------|-------|
| **v1.3.8** | Active production candidate | Until v1.4.0 certified + 90-day overlap | Current deploy target |
| **v1.3.x** (post-hotfix) | LTS maintenance | 12 months after v1.4.0 production cutover OR last v1.3.x hotfix + 6 months, whichever is later | Patch-only |
| **v1.4.x** | Active development → production | N/A | `main` until v1.4.0 tag |
| **≤ v1.3.7** | Unsupported | Immediate | No backports |

---

## Semver policy

WILMS follows [Semantic Versioning 2.0.0](https://semver.org/):

| Bump | When | Example |
|------|------|---------|
| **MAJOR** (x.0.0) | Breaking API contract, GL authoritative cutover, RBAC model break | v2.0.0 |
| **MINOR** (1.x.0) | Backward-compatible features, schema additive migrations | v1.4.0, v1.5.0 |
| **PATCH** (1.3.x) | Bug fixes, security patches, non-breaking index migrations on maintenance branch only | v1.3.8.1 |

Pre-release tags: `v1.4.0-rc.1` on `main` only; never on maintenance branch.

---

## LTS policy

**v1.3.x is designated the first LTS line** once production certification is issued.

| LTS rule | Detail |
|----------|--------|
| Duration | Minimum **12 months** from v1.4.0 production cutover |
| Scope | Critical bug fixes + security patches only |
| Features | **Rejected** on maintenance branch — cherry-pick to `main` for v1.4+ |
| Node/runtime | Frozen to certified stack (Node 20+ as shipped; Node 22 unification is v1.4 on `main`) |
| Database | Additive migrations only; no destructive DDL on LTS |

---

## Bug-fix policy

| Severity | v1.3.x maintenance | v1.4 `main` |
|----------|------------------|-------------|
| **P0 — Money integrity** (duplicate post, balance drift, auth bypass) | Hotfix within 24h SLA; backport if fix is on `main` | Fix immediately |
| **P1 — Production down** (API 5xx, DB unreachable) | Hotfix within 48h | Fix immediately |
| **P2 — Degraded** (slow lists, failed mail batch) | Next scheduled patch OR document workaround | Normal sprint |
| **P3 — Cosmetic / docs** | Defer to v1.4 unless sponsor requests | Normal sprint |

**Money-integrity fixes always trump feature work.**

---

## Security patch policy

| Class | Response | Backport |
|-------|----------|----------|
| Critical CVE (RCE, auth bypass, SQLi) | Patch within 72h of public disclosure or internal finding | Yes → `maintenance/v1.3.x` |
| High CVE (XSS, CSRF gap, secret leak) | Patch within 7 days | Yes |
| Medium/Low | Next minor on `main`; backport only if exploitable in production config | Case-by-case |
| Dependency bumps | `npm audit` weekly on maintenance branch; pin overrides documented | Minimal diff only |

Security patches **never** introduce new features or refactors.

---

## Branch strategy

```text
main                          ← v1.4+ development (feature/v1.4-* branches merge here)
  │
  ├── feature/v1.4-redis-workers
  ├── feature/v1.4-idempotency
  └── feature/v1.4-cursor-pagination
  │
  └── (after certification only)
        maintenance/v1.3.8    ← hotfixes only; tagged v1.3.8.x-production-certified
```

| Branch | Purpose | Merge direction |
|--------|---------|-----------------|
| `main` | Active development for v1.4+ | Feature branches → `main` |
| `feature/v1.4-*` | Scoped v1.4 work units | → `main` via PR |
| `maintenance/v1.3.8` | Certified production hotfixes | **Never** merge maintenance → main wholesale; cherry-pick fixes both ways as needed |
| `release/v1.4.0-rc.*` | Stabilization (optional) | → `main` then tag |

**Do not create `maintenance/v1.3.8` until certification.** Until then, emergency production fixes land on `main` and deploy via standard pipeline with expedited review.

---

## Hotfix workflow (post branch creation)

Derived from [`MAINTENANCE_BRANCH_PLAN.md`](../../certification/v1.3.8/production-cutover/MAINTENANCE_BRANCH_PLAN.md):

1. **Triage** — Confirm severity (P0/P1); open incident if P0/P1.
2. **Branch** — `git checkout maintenance/v1.3.8 && git pull`.
3. **Fix** — Minimal diff; `npm run type-check`, `npm run test -w @wilms/api`, smoke if credentials available.
4. **Review** — Two approvers for money/auth changes; one for docs-only.
5. **Tag** — `v1.3.8.N-production-certified` annotated tag.
6. **Deploy** — Railway (API) + Vercel (frontend) via standard pipeline.
7. **Cherry-pick** — Same fix to `main` if applicable (avoid drift).
8. **Evidence** — Update incident log; attach smoke output.

---

## Release workflow

### v1.3.x patch (maintenance branch)

```text
maintenance/v1.3.8 → CI gates → tag v1.3.8.N-production-certified → deploy → GitHub Release → update ops runbook
```

### v1.4.0 minor (main)

```text
feature/* → main → RC tags → staging soak → tag v1.4.0 → production cutover pack → deprecate v1.3.x LTS clock starts
```

**Release gates (both lines):**

- `npm run type-check` (frontend + api)
- `npm run test -w @wilms/api` + frontend unit tests
- `npm run verify:version`
- Migration verify on staging Neon branch
- Operator smoke (when credentials available)

---

## Freeze declaration — Phase 24.1

Effective upon production certification issuance:

| Frozen on v1.3.x | Allowed on v1.4 `main` |
|------------------|------------------------|
| Feature development | All v1.4 backlog |
| Dependency major upgrades | Node 22 unify, Redis, BullMQ, OTel |
| Schema breaking changes | Additive migrations + new tables (outbox, idempotency enforcement) |
| RBAC model changes | ABAC prep (v1.5) |

---

## Communication

| Event | Notify |
|-------|--------|
| Hotfix deployed | Ops + sponsor within 1h |
| LTS end-of-life announced | 90 days prior |
| v1.4.0 cutover date set | 30 days prior |

---

## Open items (operator)

- [ ] Complete `PRODUCTION_ACCEPTANCE_CHECKLIST.md` pending rows
- [ ] Issue `FINAL_PRODUCTION_CERTIFICATE.md`
- [ ] Execute `MAINTENANCE_BRANCH_PLAN.md` commands
- [ ] Confirm `WILMS_METRICS_TOKEN` for authenticated `/ops/metrics` scrape
