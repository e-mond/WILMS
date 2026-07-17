# Documentation Audit (Phase 17)

**Date:** 17 July 2026  
**Goal:** Every critical doc complete, current, consistent, and usable by a new engineer without tribal knowledge.

---

## 1. Inventory (canonical)

### Must-read for new developers

| Doc | Status | Notes |
|---|---|---|
| Root `README.md` | Present | Keep as entry |
| `AGENTS.md` / `CONTRIBUTING.md` | Present | CONTRIBUTING still P14.3B-flavored — **needs update** |
| `docs/certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md` | **Generated this sprint** | Backend+frontend SSoT |
| `docs/security-guide.md` | Present | Good |
| `docs/deployment-guide.md` | Present | Good |
| `docs/authentication.md` | Present | Good |
| `docs/financial-calculations.md` | Present | Align with post-remediation ledger |
| `docs/api-overview.md` | Present | Thin — no OpenAPI SSoT |
| `docs/operations/production-runbook.md` | Present | |
| `docs/operations/backups.md` | Present | Restore drills often unverified |
| `docs/operations/monitoring.md` | Present | |
| `docs/adr/ADR-001`…`005` | Present | Frontend-heavy |
| `packages/shared-rbac` | Code as matrix | Documented in cert pack |
| `apps/backend/README.md` | Present | |

### Certification packs

| Path | Role |
|---|---|
| `docs/certification/v1.3.7/*` | Prior release cert |
| `docs/certification/v1.3.8/EXTERNAL_ENTERPRISE_AUDIT.md` | External findings |
| `docs/certification/v1.3.8/enterprise-financial/*` | Critical/High remediation |
| `docs/certification/v1.3.8/enterprise-architecture/*` | Phase 17 |

---

## 2. Findings

| ID | Severity | Finding | Action |
|---|---|---|---|
| D-01 | High | Doc sprawl: many root `FINAL_*` / `*_AUDIT` overlap cert packs | Add index; mark historical as archive |
| D-02 | High | `docs/architecture/README.md` / `docs/AGENTS.md` may reference obsolete `context/` paths | Fix pointers to `docs/architecture` + `docs/adr` |
| D-03 | High | No single **system** architecture SSoT (UI-centric architecture.md) | Use new `SYSTEM_ARCHITECTURE.md` |
| D-04 | Medium | `CONTRIBUTING.md` phase-locked to P14.3B | Rewrite for v1.3.x + branch naming |
| D-05 | Medium | API docs lack OpenAPI | Generate OpenAPI in v1.4 |
| D-06 | Medium | Missing ER / sequence diagrams as first-class maintained assets | Added ascii in SYSTEM_ARCHITECTURE; export mermaid later |
| D-07 | Medium | Permission matrix only in code + cert | Publish `docs/permission-matrix.md` from shared-rbac |
| D-08 | Low | Duplicate page-validation trees | Keep one; archive legacy |
| D-09 | High | Node 22 vs 20 skew undocumented | Document in deploy guide + fix in v1.4 |
| D-10 | Medium | GL absence not obvious in financial-calculations | Cross-link migration roadmap |

---

## 3. Generated / updated this sprint

- `enterprise-architecture/SYSTEM_ARCHITECTURE.md`
- `enterprise-architecture/ENTERPRISE_ARCHITECTURE_RECOMMENDATIONS.md`
- `enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md`
- `enterprise-architecture/ENTERPRISE_ROADMAP_v14_v15_v20.md`
- `enterprise-architecture/DOCUMENTATION_AUDIT.md` (this file)
- `enterprise-architecture/CODE_QUALITY_REVIEW.md`
- `enterprise-architecture/UI_UX_ENTERPRISE_REVIEW.md`
- `enterprise-architecture/INDEX.md`
- `docs/permission-matrix.md` (generated from roles)

---

## 4. Documentation completeness checklist

| Topic | Complete? | Location |
|---|---|---|
| README | Yes | `/README.md` |
| Architecture | Improved | `SYSTEM_ARCHITECTURE.md` |
| Database | Partial | Schema + migrations; need ER export |
| API | Partial | `api-overview.md` |
| Onboarding | Partial | CONTRIBUTING needs refresh |
| Deployment | Yes | `deployment-guide.md` + workflows |
| Runbooks | Yes | `operations/*` |
| Troubleshooting | Partial | Spread across guides |
| DR | Partial | cert + backups — drills |
| Security | Yes | `security-guide.md` |
| Env vars | Yes | `.env.example` + guides |
| Migrations | Yes | backend README + drizzle |
| Coding standards | Yes | `architecture/code-standards.md` |
| Contribution | Needs update | `CONTRIBUTING.md` |
| Diagrams | Bootstrap | SYSTEM_ARCHITECTURE |
| Permission matrix | Generated | `docs/permission-matrix.md` |

---

## 5. Recommended doc governance

1. **One INDEX** per major concern (architecture, cert, ops).
2. Root `FINAL_*` reports older than current minor version → `docs/archive/`.
3. Every release updates `SYSTEM_ARCHITECTURE.md` “Version context”.
4. OpenAPI becomes API SSoT in v1.4; markdown overview becomes narrative only.
