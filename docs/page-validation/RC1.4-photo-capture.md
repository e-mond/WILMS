# RC1.4 — Photo Capture

**Status:** IMPLEMENTED

## Flow

1. Officer creates session → `POST /registration/capture-sessions`
2. QR opens `https://{app}/capture/{token}`
3. Mobile page captures photo → `POST /photo-capture/sessions/:token/upload`
4. Officer polls session → preview applied to registration form

## Persistence

- Table: `photo_capture_sessions` (migration 0011)
- Status machine: `PENDING` → `CAPTURED` / `EXPIRED`
- Upload pipeline: existing Cloudinary/local upload service

## Files

- Backend: `apps/backend/src/modules/photo-capture/`
- Mobile page: `apps/frontend/src/app/capture/[token]/page.tsx`
- Officer UI: `PhoneCaptureSessionPanel.tsx`

## Delete / replace / retake

`PhotoUpload.tsx` and `deleteUploadedFile()` remove Cloudinary assets and DB references on delete/replace.
