# RC1 Notifications Audit

**Date:** 2026-07-01

## Toast notifications

| Component | Status |
|-----------|--------|
| `ToastContainer` | Global ÔÇö mounted in root layout |
| `useToast` hook | Used across settings, payments, groups |
| Success/error/warning variants | Implemented |

## In-app notification inbox

| Feature | Backend | Frontend |
|---------|---------|----------|
| List notifications | `GET /notifications` | Implemented |
| Mark read | `PATCH /notifications/:id/read` | Implemented |

## SMS/email triggers

- Payment confirmation SMS (when enabled in settings)
- Settings test SMS/email endpoints for admin verification

## Verdict

Notification infrastructure functional. Provider delivery depends on Railway env configuration.
