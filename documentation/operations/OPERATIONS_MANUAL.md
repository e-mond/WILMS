# WILMS Operations Manual

**Version:** 1.7.3  
**Audience:** DevOps, Super Admins, programme IT leads  
**Classification:** Confidential

---

## 1. Purpose

This manual covers day-to-day operational procedures for running WILMS in production and staging environments.

---

## 2. Environment overview

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | wilms.vercel.app | Live programme operations |
| Preview | Vercel preview deployments | PR validation |
| Local | localhost:3000 | Development |

---

## 3. Health monitoring

### Health check

```
GET /api/wilms/health
```

Returns service status, version, database connectivity.

### Ops dashboard

Super Admin accesses `/ops` for:
- Active incidents
- Maintenance windows
- System metrics summary

---

## 4. Daily operations checklist

| Task | Frequency | Owner |
|------|-----------|-------|
| Verify health endpoint | Daily | DevOps |
| Review ops incidents | Daily | Super Admin |
| Monitor reconciliation aging | Daily | Super Admin |
| Review notification cron logs | Daily | DevOps |
| Check Neon connection pool | Weekly | DevOps |
| Review audit log anomalies | Weekly | Auditor/Admin |
| Run smoke tests post-deploy | Per deploy | DevOps |

---

## 5. Deployment procedure

### Pre-deploy

1. Verify branch passes CI (lint, type-check, test).
2. Run `npm run verify:version`.
3. Run `npm run verify:migrations`.
4. Review CHANGELOG for release notes.

### Deploy

1. Merge to production branch.
2. Vercel auto-deploys on push.
3. Migrations applied: `npm run db:migrate -w @wilms/domain`.
4. Post-deploy smoke: `npm run smoke:production`.

### Rollback

1. Revert Vercel deployment to previous build.
2. Database rollback requires manual SQL — migrations are forward-only.
3. Document incident in ops module.

---

## 6. Database operations

### Connection

Neon serverless PostgreSQL via `DATABASE_URL`. Connection pooling enabled.

### Migrations

```bash
npm run db:migrate -w @wilms/domain
npm run verify:migrations -w @wilms/api
```

### Backup

Neon provides automated point-in-time recovery. Verify backup retention in Neon dashboard. Run restore drill: `npm run drill:backup-restore`.

### Demo data cleanup

```bash
npm run cleanup:demo-financial-data -w @wilms/domain
```

### Location master import

```bash
npm run seed:location-master -w @wilms/domain
npm run db:backfill:locations -w @wilms/domain
```

### Reset transactional data (keep users and RBAC)

```bash
WILMS_CONFIRM_DB_RESET=YES npm run db:reset:keep-users -w @wilms/domain
```

Preserves `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permission_overrides`, and `__drizzle_migrations`. Then re-import locations.

---

## 7. Cron and scheduler

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Notification dispatch | 06:00 UTC daily | `/api/cron/notifications` |

Configured in `vercel.json`. Verify cron execution in Vercel dashboard logs.

---

## 8. User management operations

### Invite new user

Super Admin → Settings → Users → Invite. User receives email with invitation link. First login transitions status from INVITED to ACTIVE.

### Force logout

Super Admin → User profile → Force logout. Invalidates all active sessions for that user.

### Permission overrides

Grant individual permissions beyond role defaults. All overrides audited.

### Password reset

Users can self-service via forgot-password flow. Admin cannot view passwords.

---

## 9. Incident response

### Severity levels

| Level | Description | Response time |
|-------|-------------|---------------|
| P1 | Production down, data integrity risk | Immediate |
| P2 | Major feature degraded | 4 hours |
| P3 | Minor issue, workaround available | 24 hours |
| P4 | Cosmetic, documentation | Next sprint |

### P1 procedure

1. Create ops incident in WILMS.
2. Check health endpoint and Vercel status.
3. Check Neon status page.
4. Rollback deployment if recent deploy caused issue.
5. Notify programme director.
6. Post-incident review within 48 hours.

---

## 10. Maintenance windows

Schedule via Ops module before:
- Database migrations with downtime risk
- Major version deployments
- Neon maintenance periods

Maintenance window displays banner to all users.

---

## 11. Security operations

| Task | Procedure |
|------|-----------|
| Rotate session secret | Update `WILMS_SESSION_SECRET` in Vercel; all users re-login |
| Rotate production users | `npm run rotate-production-users -w @wilms/domain` |
| Review failed login attempts | Audit log filter by `auth.login_failed` |
| Upload audit | Review upload logs for anomalous file types |

---

## 12. Performance monitoring

- Bundle budget: `npm run bundle:budget-check`
- Performance budget: `npm run perf:budget-check`
- API rate limit: 300 req/min global; monitor 429 responses

---

## 12a. Ghana location hierarchy

Refresh official geography after a licensed dataset update:

```bash
npm run db:apply:ghana-hierarchy -w @wilms/domain
npm run seed:ghana-hierarchy -w @wilms/domain
```

Confirm `GET /api/v1/locations/sync/status`. Do not delete historical location rows. Community suggestions are Super Admin review items, never auto-created.

---

## 13. Documentation maintenance

Generate updated PDF/DOCX after documentation changes:

```bash
npm run docs:generate
```

Outputs in `documentation/pdf/` and `documentation/docx/`.

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
