# WILMS Execution Roadmap — Post Demo Mode

> Updated: 2026-06-09

## Metrics snapshot

| Metric | Value |
|---|---|
| Backend readiness | **78%** (+2% from IDataProvider + contracts) |
| Demo Mode compliance | **88%** |
| Hardcoded-data violations (UI) | **4 low / 2 medium** |
| Pages API-ready (service-backed) | **32 / 36 routes** |
| Pages with direct mock constants | **1** (`LoginForm` demo picker only) |

---

## P0 — Next phase (in order)

### 1. Mobile reference parity ✅ (implementation complete 2026-06-09)
- Collectors: `CollectorsMobileCardList` — card-first `<lg`, table `lg+`
- Loan Pools: enhanced mobile cards with full financial grid
- Dashboard: responsive upper grid, compact analytics column, overflow fixes
- Audit: `context/page-validation/P0-mobile-reference-parity.md`
- **Pending:** stakeholder JPEG sign-off

### 2. RBAC enforcement
- Role editor UI (permission matrix)
- Permission editor per role
- `PermissionGate` on pages and destructive actions
- Middleware alignment with permission catalog

### 3. Super Admin user management
- Reset password / reset PIN
- Full user profile modal
- Role + permission assignment
- Suspend / activate / delete flows

### 4. Backend contract stubs
- OpenAPI or typed route map from `src/contracts/README.md`
- DTO validation schemas (Zod) mirroring API payloads
- API adapter error normalization (hide raw errors in UI)

---

## P1

5. Legal terms management UI (Super Admin editable)  
6. Profile photos everywhere (`Avatar photoUrl` from services)  
7. `PermissionGate` rollout all routes  
8. Full accessibility audit (axe + manual)

---

## P2

9. Auditor role (middleware + nav + read-only enforcement)  
10. Read-only role completion  
11. Production phone-capture service + websocket sync  
12. Final responsive / dark mode / export / print audits

---

## Pages API-ready vs pending

### API-ready (consume `@/services` only)

| Route | Primary services |
|---|---|
| `/dashboard` | dashboard, collectionMetrics, expense |
| `/borrowers`, `/borrowers/[id]` | borrower, loan |
| `/collectors`, `/collectors/[id]` | collectorManagement |
| `/groups`, `/groups/[id]` | group |
| `/loan-pools` | loanPool |
| `/risk-flags` | riskFlag |
| `/reports/*` | report, audit |
| `/settings` | settings |
| `/officer/*` | borrower, photoCaptureSession, settings |
| `/approver/*` | borrower |
| `/collector/*` | collector, payment, expense, reconciliation |
| `/loans/*` | loan, transaction |
| `/adjustments` | adjustment |

### Pending / partial

| Route | Gap |
|---|---|
| `/login` | Demo account list in UI (intentional UX) |
| Production-only | Multipart uploads, websocket capture |

---

## Hardcoded data — remaining

See `mock-data-compliance-v4.md` for full table.

**UI business data in components:** none (post-fix).  
**Factory reference scales in `constants/`:** acceptable (not rendered in UI directly).  
**Navigation/config constants:** acceptable per ADR-003.

---

## Completion gate (unchanged)

No page marked complete until: reference, responsive, a11y, dark mode, mobile, export, print, and performance audits pass.
