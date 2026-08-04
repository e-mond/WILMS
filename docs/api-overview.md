# API overview

WILMS v1.5 exposes the domain HTTP API through Next.js Route Handlers at **`/api/wilms/*`**.

Path mapping and transport details: [`ARCHITECTURE.md`](ARCHITECTURE.md).  
Auth: [`authentication.md`](authentication.md).  
Release transport notes: [`v1.5/API_ROUTE_HANDLER_REPORT.md`](v1.5/API_ROUTE_HANDLER_REPORT.md).

The browser uses `apps/frontend/src/utils/apiClient.ts` against `NEXT_PUBLIC_API_BASE_URL` (typically `/api/wilms`).
