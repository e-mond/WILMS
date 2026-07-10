# WILMS - Project Status

**Last updated:** 2026-07-09 (v1.3.2 ready)  
**Package version:** `1.3.2`  
**Branch:** `cursor/v1.3.2-field-ops-8847`  
**Production:** v1.3.1 deployed — v1.3.2 pending

---

## Summary

v1.3.2 continues field-operations work: holiday-aware schedules, offline expense queueing and sync, and persisted collector read models for offline dashboard access.

---

## v1.3.2 scope

| Item | Status |
|------|--------|
| Holiday-aware schedule date shifting | ✅ |
| Offline expense sync + collector form queueing | ✅ |
| TanStack Query persist for collector read models | ✅ |
| Banner/sync UX for mixed payment + expense queues | ✅ |

---

## v1.3.1 scope

| Item | Status |
|------|--------|
| QUEUED_FOR_REVIEW queue UX | ✅ |
| Offline photo/document upload queue | ✅ |
| Guarantor scoring on eligibility API | ✅ |
| Collector dashboard sync widget | ✅ |
| QR scanner on My Borrowers | ✅ |
| Organization holidays API | ✅ |
| Offline expense queue type (foundation) | ✅ |
| Mock/prod sync status alignment | ✅ |

---

## Deploy checklist

Migrations through `0020_v130_field_operations.sql` are required (includes `organization_holidays`). No new migration in v1.3.2.

```bash
npm run db:migrate -w @wilms/api
```

---

## Next candidates

- Admin UI for organization holidays management
- Bluetooth thermal receipt printing integration
- Offline registration draft sync expansion
- Service worker cache for collector API responses
