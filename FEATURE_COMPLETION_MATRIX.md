# WILMS — Feature Completion Matrix

**Audit date:** 2026-07-04 · **Release:** v0.2.2 · **Commit:** `487708b`

Legend: **Impl** = Implemented · **Partial** = working with gaps · **No** = not implemented · **Polish** = needs UX/tests/docs

| Module | Completion | Backend | Frontend | API | DB | UI | UX | Prod ready? |
|--------|------------|---------|----------|-----|----|----|-----|-------------|
| Authentication | 95% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| RBAC / permissions | 90% | Impl | Impl | Impl | Impl | Impl | Impl | Yes (smoke 11/11) |
| Borrowers | 90% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Registration (wizard) | 88% | Impl | Impl | Impl | Impl | Impl | Partial | Yes (export on review step) |
| Registration drafts | 90% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Photo capture (webcam) | 85% | Partial | Impl | Partial | Impl | Impl | Partial | Partial — `/capture/[token]` blocked by middleware |
| Mobile QR capture | 60% | Impl | Partial | Impl | Impl | Partial | No | No — route not public |
| Guarantor validation | 90% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Approvals workflow | 88% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Loans (origination) | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Loan disbursement | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Loan pools | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Payments / collections | 88% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Admin fee recording | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Reconciliation | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Expenses | 80% | Partial | Impl | Partial | Impl | Impl | Impl | Yes (memory fallback without DB) |
| Groups | 88% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Group formation | 75% | Impl | Partial | Impl | Impl | Partial | Partial | Partial |
| Collectors | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Dashboard (super admin) | 88% | Impl | Impl | Impl | Impl | Impl | Partial | Yes |
| Dashboard (collector) | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Reports (8 types) | 85% | Impl | Impl | Impl | Impl | Impl | Partial | Yes |
| Export framework | 90% | N/A | Impl | N/A | N/A | Impl | Impl | Yes (iframe print) |
| Risk flags | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Overpayment review | 80% | Impl | Impl | Impl | Impl | Impl | Partial | Yes |
| Adjustments | 80% | Impl | Impl | Impl | Impl | Impl | Partial | Yes |
| Settings (system) | 85% | Impl | Impl | Impl | Impl | Impl | Partial | Yes |
| Settings (role) | 75% | Partial | Impl | Partial | N/A | Impl | Partial | Partial — localStorage prefs |
| Notifications (inbox) | 80% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| SMS / email | 75% | Partial | Impl | Impl | N/A | Impl | Partial | Partial — env-dependent |
| Messaging | 70% | Impl | Partial | Impl | Impl | Partial | Partial | Partial |
| Audit logs | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Global search | 80% | Impl | Impl | Impl | N/A | Impl | Impl | Yes |
| Offline sync | 65% | Impl | Partial | Impl | Impl | Partial | Partial | Partial — not field-validated |
| App lock / PIN | 80% | N/A | Impl | N/A | N/A | Impl | Impl | Yes (collector) |
| Ghana locations | 90% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| GPS / current location | 50% | Stub | Impl | Stub | N/A | Impl | Partial | No — API returns `0,0` |
| User management | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes |
| Uploads / Cloudinary | 85% | Impl | Impl | Impl | Impl | Impl | Impl | Yes (prod health confirms) |
| Analytics | 60% | Partial | Partial | Partial | Impl | Partial | Partial | Partial |

---

## Frontend route inventory (47 pages)

| Route group | Pages | Broken / blocked |
|-------------|-------|------------------|
| Super admin | 23 | None confirmed — all mount real components |
| Collector | 10 | None confirmed |
| Approver | 4 | None confirmed |
| Auditor | 3 | None confirmed |
| Registration officer | 3 | None confirmed |
| Auth | 2 | None confirmed |
| `/capture/[token]` | 1 | **Likely blocked** — not in public paths / middleware |
| `/` landing | 1 | **Unreachable** — middleware redirects to login/role home |

### Frontend quality signals

| Check | Result |
|-------|--------|
| Global 404 | `app/not-found.tsx` present |
| Error boundaries | `app/error.tsx`, registration-officer error |
| Loading states | Per route-group `loading.tsx` |
| Placeholder copy scan | **0 hits** for "coming soon" / "not yet available" in production UI code |
| Responsive / a11y | Recent Vercel a11y pass; 3 unit test regressions from label changes |
| Console / hydration | **Not verified** in browser this audit |
| E2E | 15 Playwright specs — **not re-run** this audit |

---

## Evidence sources

- Backend modules: `apps/backend/src/modules/*` (28 route modules)
- Frontend features: `apps/frontend/src/features/*` (20+ feature areas)
- Production smoke BFF proxies: 200 on dashboard, borrowers, loans, reports, settings, groups, pools, risk-flags, messages, collectors
- Subagent page scan: 47 `page.tsx` files under `app/`
