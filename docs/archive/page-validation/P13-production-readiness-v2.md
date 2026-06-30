# P13 Production Readiness v2

Recalculated: 2026-06-15 after P13 follow-up. Evidence from validation runs and code inspection only.

---

## Validation runs (this session)

| Command | Result |
|---------|--------|
| `npm run type-check` | **Pass** |
| `npm run lint` | **Pass** (no warnings) |
| `npm run test` | **400 passed** (2×200 shards) |
| `npm run build` | **Pass** (42 routes) |
| `npm run test:e2e` | **153 failed, 2 passed, 1 skipped** — see `P13-e2e-execution.md` |

---

## A. Frontend readiness

| Area | Status | Evidence |
|------|--------|----------|
| UI / layouts | Complete (P11–P12) | No redesign in follow-up; build pass |
| RBAC route guards | Complete | 5 portal `RoleGuard`s + `permission-matrix.ts` |
| RBAC action gates | **Follow-up complete** | 18 additional gates; see `P13-rbac-gap-closure.md` |
| Uploads | **5/5 workflows wired** | Profile, borrower, guarantor, registration attachment, expense receipt |
| Print / export | Complete (P11–P12) | Gated via `WilmsExportActions`; not modified |
| Responsiveness | Complete (P11) | Not retested in E2E (blocked) |
| Navigation | Complete (P11) | Not modified |
| Forms / wizards | Complete + upload | Registration + expense document upload added |
| Dashboards / KPIs | Complete (P11–P12) | KPI values from service data, not hardcoded in components |
| Avatar rendering | **Partial** | Upload URL on major lists; some profile/collector surfaces still Dicebear-only |

### Frontend score (checklist)

| Category | Ratio | Score |
|----------|-------|-------|
| RBAC action gates (audited mutations) | ~95% gated | 95% |
| Upload workflows (5 requested) | 5/5 | 100% |
| Photo URL on avatar surfaces | ~12/16 audited | 75% |
| Unit/build/lint | 4/4 pass | 100% |

**Composite frontend readiness:** **(95 + 100 + 75 + 100) / 4 = 92.5%**

---

## B. Full production readiness

| Area | Status | Blocker |
|------|--------|---------|
| Backend APIs | Stubs only | No live API server |
| Upload endpoints | Contract defined | Storage/CDN not implemented |
| Authentication | Next route `/api/auth/login` | Real IdP not integrated |
| Audit ingestion | Client + mock | Server persistence required |
| Notifications | Mock inbox | Persistent delivery required |
| E2E coverage | **Blocked** | Login form not visible in E2E run |

### Full production score

| Category | Score | Notes |
|----------|-------|-------|
| Frontend (above) | 92.5% | |
| Backend implementation | 0% | No verified live endpoints |
| E2E pass rate | 1.3% (2/156) | Environment failure, not spec coverage |
| Demo/mock pipeline | 100% | 400 unit tests, mock providers complete |

**Composite full production readiness:** **(~92.5 × 0.5) + (0 × 0.3) + (1.3 × 0.1) + (100 × 0.1) ≈ 57%**

Weighting: frontend 50%, backend 30%, E2E 10%, demo pipeline 10%.

---

## C. Delta from P13 v1 report

| Item | v1 | v2 |
|------|----|----|
| RBAC gaps | 7 listed | Closed (see gap-closure doc) |
| Upload attachments/receipts | Not wired | Wired |
| Photo URL in lists | Not wired | Partial — mock DTO + major UI |
| E2E executed | Not run | Run — blocked by server |
| Unit tests | 400 pass | 400 pass (unchanged count) |

---

## D. Production gate checklist

| Gate | Pass? |
|------|-------|
| type-check | Yes |
| lint | Yes |
| build | Yes |
| test | Yes |
| test:e2e | **No** |

Frontend is **demo-ready** at ~93%. Full production blocked on backend + E2E environment fix.
