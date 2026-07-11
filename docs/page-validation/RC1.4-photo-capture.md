# RC1.4 — Photo Capture

**Status:** IMPLEMENTED (v1.3.4 stabilization fix for public route 401)

## Flow

1. Officer creates session → `POST /registration/capture-sessions` (authenticated, `CAPTURE_DOCUMENTS`)
2. QR opens `https://{WILMS_APP_URL}/capture/{token}`
3. Mobile page loads session → `GET /photo-capture/sessions/:token` (**no auth** — token is the capability)
4. Mobile page captures photo → `POST /photo-capture/sessions/:token/upload` (**no auth**, token-gated; BFF exempt from CSRF)
5. Officer polls session → `GET /registration/capture-sessions/:token` (authenticated)

## Persistence

- Table: `photo_capture_sessions` (migration 0011)
- Status machine: `PENDING` → `CAPTURED` / `EXPIRED`
- TTL: 15 minutes (lazy expiry on read)
- Upload pipeline: existing Cloudinary/local upload service

## Architecture constraint

Public capture routes must mount **before** routers with blanket `requireAuth` in `apps/backend/src/http/app.ts`. Otherwise Express returns 401 for all unauthenticated `/api/v1` traffic before the capture handler runs.

## Files

- Backend: `apps/backend/src/modules/photo-capture/`
- Mobile page: `apps/frontend/src/app/capture/[token]/page.tsx`
- Officer UI: `PhoneCaptureSessionPanel.tsx`
- BFF proxy: `apps/frontend/src/app/api/wilms/[...path]/route.ts`

## Troubleshooting

| Symptom | Likely cause | Check |
|---------|--------------|-------|
| Mobile: "Capture session not found or expired" immediately | Public lookup returned 401 (pre-v1.3.4 router order bug) or 404 | `curl` lookup endpoint — must not be 401 |
| Mobile: "temporarily unavailable" | `DATABASE_URL` unset on Railway | API health `database.connected` |
| QR opens wrong domain | `WILMS_APP_URL` mismatch | Railway env vs Vercel domain |
| Upload fails after camera works | CSRF on BFF (pre-v1.3.4) or expired session | Upload must not return 403 |
| Desktop never receives photo | Officer polling auth failure or preview URL | Officer session + `uploadId`/`previewUrl` on session |

```bash
# Post-deploy: must return 404 or 503, never 401
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://{app}/api/wilms/photo-capture/sessions/pcs_invalid00000001"
```

## Delete / replace / retake

`PhotoUpload.tsx` and `deleteUploadedFile()` remove Cloudinary assets and DB references on delete/replace.
