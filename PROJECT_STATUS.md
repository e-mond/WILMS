# WILMS - Project Status

**Last updated:** 2026-07-08 (v1.3.1 ready)  
**Package version:** `1.3.1`  
**Branch:** `cursor/v1.3.1-offline-expansion-8847`  
**Production:** v1.3.0 deployed — v1.3.1 pending

---

## Summary

v1.3.1 closes offline UX gaps from v1.3.0: upload queue wiring, approver-review messaging, guarantor scoring on the API, collector sync visibility, QR search, and organization holidays CRUD.

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

## v1.3.0 scope

| Item | Status |
|------|--------|
| PWA offline shell + background sync | ✅ |
| Device health (battery, storage, uploads) | ✅ |
| Sync conflict approver UI | ✅ |
| QR/barcode scanner + receipt printing | ✅ |
| Grace periods in repayment engine | ✅ |
| Fees, penalties, guarantor scoring (domain) | ✅ |
| Documentation | ✅ |
| Tests & reports | ✅ |

See [V1.3.0_FIELD_OPERATIONS_REPORT.md](./V1.3.0_FIELD_OPERATIONS_REPORT.md).

---

## Deploy checklist

```bash
npm run db:migrate -w @wilms/api
```

Migrations through `0020_v130_field_operations.sql` (includes `organization_holidays` table).

---

## Next candidates

- Offline expense sync handler and collector expense form queueing
- TanStack Query persist for collector read models offline
- Holiday-aware schedule date shifting in repayment engine
- Bluetooth thermal receipt printing integration
