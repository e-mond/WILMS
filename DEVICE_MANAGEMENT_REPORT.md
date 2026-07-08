# Device Management Report — v1.3.0

## Battery Optimization

- `useBatteryStatus` detects low charge and pauses background sync when saver mode is active
- `sync-policy.ts` honors auto-sync toggle and configured interval from collector settings

## Storage Monitoring

- `useStorageEstimate` reports quota usage via `navigator.storage.estimate`
- `DeviceHealthPanel` shows offline queue count and pending upload bytes
- Critical storage warning at 85% utilization

## Background Uploads

- IndexedDB queue in `upload-queue.ts`
- `BackgroundUploadProcessor` drains when online with optional compression

## Compression

- `compress-image.ts` resizes and re-encodes images before upload in low-data mode
