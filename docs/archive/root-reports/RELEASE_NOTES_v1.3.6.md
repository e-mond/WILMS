# WILMS v1.3.6 Release Notes (RC1)

**Release type:** Release Candidate  
**Tag (prepare only):** `v1.3.6-rc1`  
**Date:** 2026-07-12

---

## Overview

Production stabilisation release. **No new features.** Bug fixes, mock-data hardening, health diagnostics, and collector/admin UX corrections.

---

## Fixed

- **Collector Settings:** Removed duplicate PIN section; **App Lock** is the single device PIN configuration entry.
- **Collector security URL:** `/collector/security` redirects to Settings (legacy links preserved).
- **Admin Collectors messaging:** Fixed "Unable to open conversation" when collector ids are not UUID-shaped (e.g. demo `user-collector`).
- **Collectors aside panel:** Shows formatted collector display id (e.g. `COL-001`) instead of raw internal user id.
- **Production mock guard:** Production builds always use API data provider — mock services cannot be webpack-resolved in production.
- **Health endpoint:** Adds `degradedReasons` array explaining migration/schema/upload degradation.

---

## Operations

### Production health degraded (known on 2026-07-12)

Live health reported:
- Migrations: 22/23 applied
- Missing tables from migration `0020`: `organization_holidays`, `loan_fee_charges`, `loan_penalty_rules`

**Fix:** Run `npm run db:migrate -w @wilms/api` and verify `/health` returns `"status":"ok"`.

---

## Migration notes

Required through:
- `0020_v130_field_operations.sql`
- `0022_v135_notification_events.sql`

---

## Known issues

| Issue | Workaround |
|-------|------------|
| Production health degraded until migrate | Run DB migrations before stable certification |
| `smoke:production` not run in CI agent | Run manually post-deploy with credentials |

---

## Resolved issues (from user report)

- Duplicate PIN / App Lock on collector settings
- Mock data risk in production builds
- Health degraded without explanation
- Open messages error on admin collectors page
- Collector display id in aside panel

---

## Verification

| Gate | Result |
|------|--------|
| type-check | PASS |
| lint | PASS |
| backend tests | 108/108 |
| frontend tests | 233/233 |
| build | PASS |
| bundle budget | PASS |

---

## Upgrade path

1. Merge v1.3.6-rc1
2. `npm run db:migrate -w @wilms/api`
3. Deploy API (Railway) → verify `/health`
4. Deploy frontend (Vercel)
5. Run `smoke:production` + `smoke:rbac`
6. Tag `v1.3.6-rc1` after validation (do not publish until approved)
