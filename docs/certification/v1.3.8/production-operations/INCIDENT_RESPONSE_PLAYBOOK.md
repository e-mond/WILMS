# Incident Response Playbook — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17

## 1. Incident management

### Severity definitions

| Level | Impact | Response time target | Examples |
|-------|--------|----------------------|----------|
| **P1 — Critical** | Production down or financial integrity at risk | 15 min acknowledge; immediate mitigation | API 5xx, login broken, DB unreachable, suspected duplicate payments |
| **P2 — High** | Major feature degraded | 30 min | Email/SMS down, exports failing, RBAC breach |
| **P3 — Medium** | Limited user impact | 4 h | Single role workflow broken, slow queries |
| **P4 — Low** | Cosmetic / workaround exists | Next business day | UI formatting, non-critical notification delay |

### Roles

| Role | Responsibility |
|------|----------------|
| Incident commander | Coordinates response, communications |
| On-call engineer | Triage, rollback, logs |
| Super Admin | Business decisions, user comms, financial holds |
| DBA | Neon PITR, migration issues |

### Communication template

```
[WILMS P{n}] <short title>
Status: Investigating | Mitigating | Monitoring | Resolved
Impact: <who/what>
Start: <UTC time>
Actions: <bullet list>
Next update: <time>
```

## 2. General triage (all incidents)

1. Check `GET /health` and Super Admin `/ops`
2. Note `X-Request-Id` from failing requests; search Railway logs
3. Check recent deploys (Vercel + Railway + migrations)
4. Decide: fix-forward vs rollback ([ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md))
5. Document timeline; post-incident review within 5 business days

---

## 3. Database incidents

### Symptoms

- `/health` → `database.connected: false`
- `migrations.status: degraded`
- `schema.missingTables` non-empty
- Neon console alerts

### Playbook

1. **Confirm scope** — all users vs single query
2. **Neon console** — connectivity, compute status, connection limits
3. **If migration behind:**
   ```bash
   npm run db:migrate -w @wilms/api
   ```
4. **If migration caused corruption** — stop writes; initiate PITR ([BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md))
5. **If connection pool exhausted** — restart API service; review Neon max connections
6. Validate `/health` and financial spot-checks before all-clear

### Escalation

DBA required for PITR cutover or schema repair.

---

## 4. API / server incidents

### Symptoms

- Railway health check failing
- Elevated 5xx, timeouts
- `/health` degraded

### Playbook

1. Railway → Logs — filter `level:error`, search `requestId`
2. Railway → Metrics — CPU, memory, restart loop
3. **If post-deploy regression** — rollback API deployment
4. **If OOM / crash loop** — check recent deploy size; scale compute temporarily
5. Verify:
   ```bash
   curl -fsS https://wilms-production.up.railway.app/health
   npm run smoke:production -w @wilms/api
   ```

### In-process worker note

v1.3.8 has no Redis queue. API restart drops in-flight background jobs (mail/notifications). After recovery, check failed notification delivery in Communication Center.

---

## 5. SMS incidents

### Symptoms

- SMS not delivered; `wilms_sms_configured` = 0
- Provider API errors in logs

### Providers (env-driven)

| Provider | Env |
|----------|-----|
| SMSNotifyGH (default) | `SMS_PROVIDER=smsnotifygh`, `SMSNOTIFYGH_API_KEY`, `SMSNOTIFYGH_SENDER_ID` |
| Arkesel | `SMS_PROVIDER=arkesel`, `ARKESEL_*` |
| Twilio | `SMS_PROVIDER=twilio`, `TWILIO_*` |

### Playbook

1. `/ops` or `/health` → SMS integration status
2. Verify Railway secrets; provider dashboard for quota/balance
3. Test transactional SMS (password reset / OTP if enabled)
4. **Workaround:** In-app notifications still work; communicate manual outreach
5. **P2** until resolved — not P1 unless auth depends solely on SMS OTP

---

## 6. Email incidents

### Symptoms

- Invitations/password resets not received
- `[mail] * failed` in logs
- `wilms_mail_configured` = 0

### Architecture

- **Gmail:** Railway sets `MAIL_PROVIDER=gmail`; SMTP often blocked on Railway → relay via Vercel `/api/mail/send`
- **Resend:** Direct HTTPS from Railway
- **SMTP:** Generic SMTP from Railway

### Playbook

1. Verify Railway: `MAIL_PROVIDER`, `MAIL_FROM`, `WILMS_VERCEL_MAIL_URL` (origin only), `WILMS_INTERNAL_MAIL_SECRET`
2. Verify Vercel: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, matching internal secret
3. Test relay:
   - Trigger invitation from Super Admin
   - Check Vercel function logs for `/api/mail/send`
4. **Resend path:** Verify `RESEND_API_KEY` and domain verification
5. **Workaround:** Manual password reset by Super Admin; in-app notifications

---

## 7. Queue / background job incidents

### v1.3.8 reality

| Component | State |
|-----------|-------|
| Redis | `not_used` |
| Queue | `in_process` |
| Scheduler | `http_triggered` |

### Symptoms

- Delayed notifications
- Mail sent minutes late after API load spike
- Jobs lost after API restart

### Playbook

1. Confirm `/ops` → Queue Workers surface (in-process note)
2. Check API restart events in Railway
3. **Mitigation:** Restart API during low-traffic window if stuck handlers suspected
4. **Not a Redis/BullMQ incident** until v1.4 — do not provision Redis expecting current code to use it
5. Long-term: [LONG_TERM_MAINTENANCE_PLAN.md](./LONG_TERM_MAINTENANCE_PLAN.md)

---

## 8. Security incidents

### Symptoms

- Suspected credential leak
- Unusual audit log entries
- Brute force (`RATE_LIMITED` spikes)
- Unauthorized role access

### Playbook

1. **Contain**
   - Rotate `WILMS_SESSION_SECRET` (forces re-login)
   - Rotate leaked API keys (SMS, Cloudinary, metrics token)
   - Suspend affected users (Super Admin → Users)
2. **Investigate**
   - Audit log (`/reports/audit-log`)
   - Railway logs by `requestId` and IP
   - RBAC smoke: `npm run smoke:rbac`
3. **Eradicate** — patch vulnerability; deploy fix
4. **Recover** — validate permissions; notify affected users per policy
5. **Report** — document for compliance; legal if PII breach

### Controls reference

Helmet, CSRF on BFF, login rate limit (20/15min), account lockout settings, HMAC sessions, demo accounts disabled on production DB.

See [security-guide.md](../../../security-guide.md).

---

## 9. Deploy incidents

### Symptoms

- Deploy workflow failed
- Version mismatch (`verify:version` fails)
- `migrations_behind` after deploy

### Playbook

1. GitHub Actions → failed job logs
2. **Migration failure** — do not promote frontend; fix DB or restore PITR
3. **API deploy OK, frontend failed** — partial deploy; rollback frontend or complete deploy
4. **verify:deploy-sync fails** — API not on expected git SHA; redeploy
5. Run full post-deploy validation from [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)

---

## 10. Financial incidents

### Symptoms

- Negative operating cash alert on `/ops`
- Pool balance mismatch vs reports
- Duplicate payment suspicion
- Overpayment flag surge

### Playbook

1. **Stop the bleeding** — Super Admin halt disbursements if integrity uncertain
2. **Preserve evidence** — export reports; note timestamps; capture `requestId`
3. **Triage**
   - Dashboard vs ledger reconciliation
   - Audit log for payment/adjustment events
   - Check offline sync conflicts (`/approver/sync-conflicts`)
4. **Do not** manual SQL balance fixes — use approved adjustment workflow
5. **Recovery**
   - Reversal engine for erroneous postings (Super Admin approval chain)
   - PITR only if widespread corruption ([BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md))
6. **Post-incident** — financial reconciliation report; update controls

### Business rules reminder

No partial payments; no advance payments; oldest obligation first; immutable audit log.

---

## 11. Post-incident review

| Item | Detail |
|------|--------|
| Timeline | UTC timestamps |
| Root cause | Technical + process |
| Detection | How found; alert gaps |
| Action items | Owners, due dates |
| Runbook updates | PR to this pack if needed |

## 12. Related docs

- [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md)
- [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md)
- [PRODUCTION_SUPPORT_MANUAL.md](./PRODUCTION_SUPPORT_MANUAL.md)
