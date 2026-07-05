# RC1.1 ÔÇö Architecture Sync

**Date:** 2026-07-01

## Request flow

```text
Browser ÔåÆ Vercel (Next.js)
  Ôö£ÔöÇ /api/auth/*     ÔåÆ BFF auth routes (CSRF, login, logout)
  Ôö£ÔöÇ /api/wilms/*    ÔåÆ Proxy ÔåÆ Railway Express API
  ÔööÔöÇ App pages       ÔåÆ React Query ÔåÆ apiClient ÔåÆ /api/wilms

Railway Express (:4000)
  Ôö£ÔöÇ requireAuth + requirePermission (per-route)
  Ôö£ÔöÇ Drizzle ORM ÔåÆ Neon PostgreSQL
  ÔööÔöÇ Cloudinary uploads
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

Custom `sw.js` ÔÇö shell cache v2, skip waiting on update, `controllerchange` reload for stale chunks.

## Verdict

Architecture documented and matches deployed topology.
