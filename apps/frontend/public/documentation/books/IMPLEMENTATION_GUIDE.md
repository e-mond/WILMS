# WILMS Implementation Guide

**Version:** 1.7.3  
**Audience:** Deployment teams, programme rollout leads  
**Classification:** Confidential

---

## 1. Implementation overview

This guide covers deploying WILMS for a new programme instance from infrastructure setup through go-live.

**Estimated timeline:** 2–4 weeks depending on data migration needs.

---

## 2. Phase 1: Infrastructure (Week 1)

### 2.1 Accounts

| Service | Purpose |
|---------|---------|
| Vercel | Application hosting |
| Neon | PostgreSQL database |
| Email provider | Transactional email (optional SMS provider) |

### 2.2 Repository setup

```bash
git clone <repository-url>
cd WILMS
npm ci
```

### 2.3 Environment variables

Configure in Vercel dashboard:

| Variable | Value |
|----------|-------|
| DATABASE_URL | Neon connection string |
| WILMS_SESSION_SECRET | 32+ character random string |
| NEXT_PUBLIC_API_BASE_URL | /api/wilms |
| NEXT_PUBLIC_USE_MOCK | false |

Optional: REDIS_URL for rate limiting.

### 2.4 Database migration

```bash
npm run db:migrate -w @wilms/domain
npm run verify:migrations -w @wilms/api
```

### 2.5 Deploy

Push to production branch. Vercel auto-deploys.

Verify: `GET /api/wilms/health`

---

## 3. Phase 2: Organisation setup (Week 1–2)

### 3.1 Super Admin account

Create initial admin via seed script or first-user bootstrap. Change default password immediately.

### 3.2 Organisation settings

Configure: organisation name, notification preferences, quiet hours, holiday calendar.

### 3.3 Loan pools

Create capital pools with initial replenishment matching programme funding.

### 3.4 Location hierarchy

Seed Ghana locations: `npm run seed:ghana-locations -w @wilms/api`

---

## 4. Phase 3: User provisioning (Week 2)

### 4.1 Role planning

| Role | Typical count | Notes |
|------|---------------|-------|
| Super Admin | 1–2 | Programme administrators |
| Registration Officer | 2–5 | HQ registration staff |
| Collector | 10–50 | Field agents |
| Approver | 2–3 | Loan decision authority |
| Auditor | 1–2 | Read-only oversight |

### 4.2 Invite users

Settings → Users → Invite. Assign appropriate roles. Users complete first-login onboarding.

### 4.3 Permission overrides

Grant only when role defaults insufficient. Document all overrides.

---

## 5. Phase 4: Group and collector setup (Week 2)

1. Create borrower groups aligned with community structure
2. Assign collectors to groups
3. Verify collector field shell access on mobile devices
4. Test offline payment queue

---

## 6. Phase 5: Pilot (Week 3)

### 6.1 Pilot scope

- 1–2 groups
- 10–20 borrowers
- 1 collector
- Full lifecycle: register → approve → disburse → collect → reconcile

### 6.2 Validation checklist

- [ ] Borrower registration with documents and GPS
- [ ] Loan approval workflow
- [ ] Admin fee collection
- [ ] Disbursement with pool hard-stop test
- [ ] Weekly collection (online and offline)
- [ ] Daily reconciliation
- [ ] Expense submit and review
- [ ] Report generation and export
- [ ] Notification delivery
- [ ] Audit log completeness

---

## 7. Phase 6: Go-live (Week 4)

### 7.1 Data migration (if applicable)

Import existing borrower/loan data via admin tools or custom migration script. Validate against source records.

### 7.2 Training

Distribute role manuals from `documentation/user-guides/`. Conduct hands-on sessions per role.

### 7.3 Go-live checklist

- [ ] All users invited and active
- [ ] Pools funded with correct capital
- [ ] Groups and collectors assigned
- [ ] Pilot validation passed
- [ ] Smoke tests pass: `npm run smoke:production`
- [ ] Ops incident process communicated
- [ ] Backup/recovery verified

---

## 8. Post go-live

| Task | Frequency |
|------|-----------|
| Monitor health endpoint | Daily |
| Review reconciliation aging | Daily |
| Run smoke tests post-deploy | Per deploy |
| Export compliance pack | Monthly |
| Review audit log | Weekly |
| Update documentation | Per release |

---

## 9. Rollback plan

1. Revert Vercel deployment to previous build
2. Database is forward-only — plan migrations carefully
3. Document incident in ops module
4. Communicate to users via maintenance window banner

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
