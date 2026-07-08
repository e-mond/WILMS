# WILMS Mobile & Field Guide

**Version:** 1.3.0

## Progressive Web App

### Install

- **Android / Chrome:** Use the install banner or browser menu → Install app
- **iOS:** Share → Add to Home Screen (`PwaIosInstallPrompt` provides guidance)

### Manifest

- `start_url`: `/collector/dashboard`
- `display`: standalone
- `orientation`: any (landscape + tablet supported)

### Offline Shell

Cached assets allow the app shell to load without network. API data still requires connectivity except for queued payments.

## Collector Navigation

Bottom navigation via `OperationalBottomNavigation`:

- Dashboard
- My Borrowers
- Payment
- Groups
- Settings

## Camera & Documents

| Feature | Component |
|---------|-----------|
| Passport photo | `PhotoUpload`, `WebcamCapture` |
| Phone capture session | `PhoneCaptureSessionPanel` |
| Documents / receipts | `DocumentUpload` |
| Registration review | `RegistrationReviewPanel` |

Low data mode compresses images before upload.

## QR & Barcode Scanning

`QrBarcodeScanner` uses the native `BarcodeDetector` API when available:

- QR codes
- Code 128
- EAN-13

Manual entry fallback supports business IDs (`BWR-2026-000001`, `LN-2026-000001`, etc.).

## Receipt Printing

`receipt-print.ts` generates thermal-friendly text receipts:

- Browser print dialog (PDF-friendly layout)
- Web Share API for SMS / messaging handoff

Bluetooth thermal printer integration is planned for v1.3.1.

## Field Security

- App lock PIN after idle timeout
- GPS capture on payments when verification is enabled
- Offline queue survives session expiry (payments only)

## Related

- [Device Management](./device-management.md)
- [Offline Architecture](./offline-architecture.md)
