# Final Manual Actions Required

**Version:** 1.4.2 | **Phase:** 31

## 1. Configure scheduler token + cron

```bash
# On API host
export WILMS_SCHEDULER_TOKEN="$(openssl rand -hex 32)"

# Evidence run
export WILMS_API_BASE_URL=https://staging-api.example.com
export WILMS_SCHEDULER_TOKEN=...
bash scripts/operator/run-notification-scheduler.sh
```

Enable GitHub Actions secrets `WILMS_API_BASE_URL` + `WILMS_SCHEDULER_TOKEN` for `.github/workflows/notification-scheduler.yml`.

## 2. Migration 0030

```bash
DATABASE_URL=<staging> npm run db:migrate -w @wilms/api
```

## 3. Staging smoke + RBAC

```bash
bash scripts/operator/run-staging-gates.sh
```

## 4. Money-chain + provider delivery

Use Phase 29 money-chain template; send test SMS/email and attach provider message IDs.

## 5. Backup/restore + load test + WCAG + sign-offs

See Phase 29 `FINAL_MANUAL_ACTIONS_REQUIRED.md`.

## Pre-check

```bash
npm run verify:phase29
npm run test -w @wilms/api
```
