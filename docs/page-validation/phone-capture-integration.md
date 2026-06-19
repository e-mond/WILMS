# Phone Capture Session — Backend Integration Notes

> P11b deliverable | Registration Officer photo workflow

## Purpose

When a Registration Officer on desktop/laptop has no webcam, WILMS generates a secure phone capture session so the officer can scan a QR code, capture the passport photo on a mobile device, and sync the image back to the active registration session.

## Frontend mock flow (current)

| Step | Component / service | Behavior |
|---|---|---|
| 1 | `PhotoUpload` | Detects desktop without webcam via `WebcamCapture.onUnavailable` |
| 2 | `PhoneCaptureSessionPanel` | Calls `photoCaptureSessionMock.createSession()` |
| 3 | Mock session | Returns `sessionToken`, `captureUrl`, `expiresAt` |
| 4 | QR display | Renders QR via QuickChart URL encoding `captureUrl` |
| 5 | Polling | Panel polls `getSession()` every 2s until `status === CAPTURED` |
| 6 | Desktop update | Converts `capturedDataUrl` to `File` and updates form state |

Development builds expose **Simulate phone capture** to complete the loop without a real phone.

## Expected backend contracts

### POST `/registration/capture-sessions`

Request:

```json
{
  "registrationSessionId": "reg-officer-123-...",
  "officerId": "off-001",
  "target": "borrower"
}
```

Response:

```json
{
  "sessionToken": "pcs_abc123",
  "captureUrl": "https://wilms.app/capture/pcs_abc123",
  "expiresAt": "2026-06-09T12:15:00.000Z",
  "status": "PENDING"
}
```

### GET `/registration/capture-sessions/:sessionToken`

Returns session status. When the phone upload completes:

```json
{
  "sessionToken": "pcs_abc123",
  "status": "CAPTURED",
  "capturedFileName": "borrower-photo.jpg",
  "capturedMimeType": "image/jpeg",
  "downloadUrl": "https://api.wilms.app/files/..."
}
```

### POST `/capture/:sessionToken` (mobile web)

- Authenticate officer or one-time session token
- Open device camera (`capture="user"` or `getUserMedia`)
- Upload multipart image bound to session
- Emit websocket/event so desktop polling can stop

## Security requirements

- Session tokens are single-use and expire (15 minutes in mock)
- Capture URL must not expose borrower PII in query string
- Officer ID must match active registration session owner
- Uploaded images virus-scanned server-side before profile attach

## Files to replace for production

- `src/services/mock/photoCaptureSession.mock.ts` → `photoCaptureSessionService.ts`
- `src/components/forms/PhoneCaptureSessionPanel.tsx` — swap mock import for service from `@/services`
- Remove development simulate button in production builds

## Related registration package fields

Captured images attach to:

- `BorrowerRegistrationFormValues.photo`
- `BorrowerRegistrationFormValues.guarantorPhoto`

Signatures remain on-device via `SignaturePad` until submit.
