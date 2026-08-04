# RC1.1 — Architecture Sync

**Date:** 2026-07-01

## Request flow

```text
Browser → Vercel (Next.js)
  ├─ /api/auth/*     → BFF auth routes (CSRF, login, logout)
  ├─ /api/wilms/*    → Proxy → Railway Express API
  └─ App pages       → React Query → apiClient → /api/wilms

Railway Express (:4000)
  ├─ requireAuth + requirePermission (per-route)
  ├─ Drizzle ORM → Neon PostgreSQL
  └─ Cloudinary uploads
```

## BFF proxy (content decoding)

[`proxy-headers.ts`](../../apps/frontend/src/lib/api/proxy-headers.ts) strips `Content-Encoding` after Node decompresses upstream body. Request sends `Accept-Encoding: identity`.

## Data provider mode

| Env | Provider |
|-----|----------|
| Production (`NODE_ENV=production`, API URL set) | `ApiDataProvider` |
| Dev mock flag / empty API URL | `MockDataProvider` |

## RBAC

Shared permissions in `@wilms/shared-rbac`. Backend enforces per-route; frontend uses `PermissionGate` for UX only.

## PWA

Custom `sw.js` — shell cache v2, skip waiting on update, `controllerchange` reload for stale chunks.

## Verdict

Architecture documented and matches deployed topology.
