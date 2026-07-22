# Phase 32 — Final Database Report

**Status:** Journal PASS | Live migration BLOCKED

## Verified

- Migration journal entries 0000–0030 present and ordered
- Migration `0030_v142_notification_dedupe` adds `notification_delivery_records` and dedupe columns

## Blocked (G2)

```bash
DATABASE_URL=$STAGING_DATABASE_URL npm run db:migrate -w @wilms/api
psql $STAGING_DATABASE_URL -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;"
curl -fsS $STAGING_API_URL/health | jq
```

Expected: migration 0030 applied; health watermark current.
