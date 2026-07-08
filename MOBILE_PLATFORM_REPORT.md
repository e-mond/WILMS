# Mobile Platform Report — v1.3.0

## PWA

- `manifest.webmanifest` start URL: `/collector/dashboard`
- Landscape and tablet orientation supported
- Service worker precaches shell assets and supports offline navigation fallback
- Install banners remain via `PwaInstallBanner` / `PwaIosInstallPrompt`

## Scanning

- `QrBarcodeScanner` uses native `BarcodeDetector` with manual fallback
- Supports loan, borrower, receipt, and transaction lookup codes

## Receipts

- `receipt-print.ts` generates printable thermal-friendly text
- Web Share API fallback for SMS/WhatsApp-ready sharing

## Camera

- Existing `PhotoUpload`, `WebcamCapture`, and phone capture session flows retained
- Low-data mode triggers `compressImageFile()` before upload
