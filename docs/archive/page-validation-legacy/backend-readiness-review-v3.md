# Backend Integration Readiness Review

Recorded: 2026-06-09

## Overall Readiness

### **Backend readiness: 91%**

Architecture is mock-first with clear service boundaries, DTO types, and environment switching. Remaining 9% is live API wiring, session permission sync, and upload endpoints.

---

## API Layer ÔÇö 93%

| Component | Status | Notes |
|---|---|---|
| Service interfaces (`types/services.ts`) | Ready | Full `I*Service` contracts |
| Mock implementations | Ready | Centralized under `services/mock/` |
| API implementations | Stubbed | `apiClient` routes exist; need backend URLs |
| Repository ÔåÆ DataSource pattern | Ready | `IDataProvider` / `IDataSource` switch |
| DTOs / types | Ready | Domain types in `src/types/` |
| Demo fallback | Ready | `NEXT_PUBLIC_DEMO_MODE=true` |

**Blockers:** Production `NEXT_PUBLIC_API_BASE_URL` + endpoint parity verification.

---

## Authentication ÔÇö 88%

| Component | Status | Notes |
|---|---|---|
| Session cookie | Ready | Role + user id in session |
| Role enum | Ready | Includes Auditor |
| RBAC models | Ready | Permission, Role, RolePermission, UserPermissionOverride |
| PermissionProvider | Ready | Client-side resolution |
| Middleware | Ready | Permission-based route matrix |
| Permission in JWT/cookie | Missing | Middleware resolves from static role map |

**Blockers:** Embed resolved permissions in session at login for override support at edge.

---

## Uploads ÔÇö 85%

| Component | Status | Notes |
|---|---|---|
| Photo capture (webcam) | Ready | Client-side |
| Phone QR capture session | Ready | Mock service; needs API |
| Registration documents | Ready | File types in schema |
| Storage abstraction | Partial | No `IUploadService` yet |

**Blockers:** Backend upload endpoint + presigned URL flow.

---

## Reporting ÔÇö 92%

| Component | Status | Notes |
|---|---|---|
| Export document builders | Ready | PDF, CSV, Excel, print |
| Report ID standard | Ready | `generateReportId` |
| Permission-gated export | Partial | Gate on registration review; rollout needed |
| Server-side PDF | Client-only | Acceptable for MVP; server render optional |

**Blockers:** Server-side export for large datasets.

---

## Auditing ÔÇö 90%

| Component | Status | Notes |
|---|---|---|
| Audit log types | Ready | |
| Mock audit store | Ready | |
| Audit report panel | Ready | |
| Immutable write path | Mock only | Needs backend append-only store |
| User audit history | Ready | In profile builder |

**Blockers:** Backend audit ingestion API.

---

## Real-time ÔÇö 72%

| Component | Status | Notes |
|---|---|---|
| Notifications inbox | Mock | |
| Dashboard refresh | Poll/manual | No WebSocket |
| Activity feeds | Static mock | |

**Blockers:** SSE/WebSocket for live dashboard and alerts.

---

## Exact Blockers Summary

1. **API base URL + endpoint implementation** ÔÇö backend team
2. **Session permission snapshot** ÔÇö for override-aware middleware
3. **Upload service** ÔÇö photos, documents, QR capture completion
4. **Append-only audit API** ÔÇö compliance requirement
5. **Real-time channel** ÔÇö notifications and dashboard (P1)

---

## Demo Mode Verification

When backend unavailable:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

| Surface | Populated | Empty screens |
|---|---|---|
| Dashboard | Yes | No |
| Groups | Yes | No |
| Collectors | Yes | No |
| Reports | Yes | No |
| Expenses | Yes | No |
| Registration | Yes | No |

All mock data centralized in `mocks/` + `services/mock/` ÔÇö no inline arrays in components.

---

## Recommendation

Proceed with **permission rollout** and **API endpoint mapping** in parallel. Target 95%+ readiness after session permissions + upload service interfaces land.
