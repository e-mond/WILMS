# Phase 28 — Final Manual Actions Required

**Date**: 2026-07-21  
**Version**: v1.4.2

The following gates cannot be closed by code changes alone. Each must be completed by an operator with the appropriate access before Production Certified can be issued.

---

## 1. Authenticated Staging Smoke (Phase 28E)

**Required credentials**:
```
STAGING_API_URL, STAGING_ADMIN_EMAIL, STAGING_ADMIN_PASSWORD
STAGING_COLLECTOR_EMAIL, STAGING_OFFICER_EMAIL, STAGING_APPROVER_EMAIL, STAGING_AUDITOR_EMAIL
```

**Steps**: Login, logout, refresh, session revocation, role-restricted access, invitation flow, expired/replayed token rejection.

**Evidence**: HTTP status + response body log for each test case.

---

## 2. Money-Chain Smoke (Phase 28F)

**Required**: Staging environment + database access.

**Steps**: Full chain from Registration → Audit Log. Each step records actor, timestamp, entity ID, amount, expected state, actual state.

**Evidence**: Transaction chain record with financial reconciliation verification.

---

## 3. RBAC & Security Smoke — Live (Phase 28G)

**Required**: Staging environment.

**Steps**: Unauthorized route access (expect 403), cross-user access (expect 403), self-approval attempt (expect 403), token replay (expect 400).

**Evidence**: HTTP response log for each negative case.

---

## 4. Backup, Restore & DR Drill (Phase 28H)

**Required**: Staging database access (`pg_dump`, `pg_restore`).

**Steps**: Backup → restore → schema verify → migration watermark → financial totals → row counts.

**Evidence**: Backup timestamp, file size, restore duration (RTO), data integrity comparison.

---

## 5. Live Load Test (Phase 28I)

**Required**: Staging environment + k6 or equivalent.

**Steps**: 50 concurrent collectors recording payments for 60s; 10 concurrent report viewers for 30s.

**Evidence**: p95 latency, error rate, throughput report.

---

## 6. Production Secret Verification (Phase 28J)

**Required**: Access to production secrets manager.

**Checks**:
- `JWT_SECRET` ≥ 64 random characters
- `DATABASE_URL` points to production, SSL enabled
- `REDIS_URL` set for multi-instance rate limiting
- Mail provider configured and tested
- No demo credentials in any production secret

---

## 7. Demo User Purge (Phase 28J)

**Required**: Production database access.

**Query**:
```sql
SELECT id, email FROM users WHERE email LIKE '%@wilms.demo';
-- Must return 0 rows
```

---

## 8. Migration 0029 Operational Execution (Phase 28D)

**Required**: Staging database access.

**Steps**:
```bash
DATABASE_URL=<staging-url> npm run migrate
psql $DATABASE_URL -c "\d invitation_tokens"
psql $DATABASE_URL -c "\di idx_invitation_tokens*"
```

---

## 9. UX/Accessibility Manual Testing (Phase 28K)

**Required**: Running browser + screen reader.

**Steps**: Desktop/tablet/mobile responsive check, keyboard navigation, screen reader, product tour role-awareness.

---

## Dependency Upgrade Plan (Phase 28C)

| Package | Action | Timeline |
|---------|--------|----------|
| `drizzle-orm` | Upgrade to ≥ 0.45.2 with API audit | Next sprint |
| `next` | Upgrade to 15/16 (major project) | v1.5 roadmap |
| `exceljs` | Test 3.4.0 compatibility | Next sprint |
| `@playwright/test` | Upgrade to 1.61.1 | Next sprint |

---

## Sign-Offs Required

- [ ] Engineering Lead: code quality and test coverage
- [ ] Security Lead: RBAC and authentication verification
- [ ] Operations Lead: backup/restore and production configuration
- [ ] Product Lead: UX acceptance
