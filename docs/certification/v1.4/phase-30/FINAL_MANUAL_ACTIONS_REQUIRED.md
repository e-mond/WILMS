# Final Manual Actions Required — Phase 30

**Version:** 1.4.2 | **Date:** 2026-07-21

1. Apply migration 0030 on staging/production: `DATABASE_URL=... npm run db:migrate -w @wilms/api`
2. Configure daily cron: `POST /notifications/scheduler/run` with scheduler permission
3. Verify live SMS (Arkesel/Twilio/SMSNotifyGH) on staging
4. Verify live email (Resend/SMTP/relay) on staging
5. Complete remaining Phase 29 operator gates before Production Certified

See [NOTIFICATION_MANUAL_ACTIONS_REQUIRED.md](NOTIFICATION_MANUAL_ACTIONS_REQUIRED.md) and Phase 29 pack.
