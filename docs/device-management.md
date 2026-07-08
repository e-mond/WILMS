# WILMS Device Management

**Version:** 1.3.0

## Collector Device Settings

Path: **Collector → Settings → Device**

| Setting | Purpose |
|---------|---------|
| GPS verification | Require location on collections |
| Low data mode | Compress images before upload |
| Auto sync | Enable background queue drain |
| Sync interval | Minutes between retry attempts while online |

## Device Health Panel

Displays real-time field device status:

- **Battery** — level and saver-mode detection
- **Local storage** — quota usage with critical warning at 85%
- **Offline operations queue** — pending payment count
- **Pending uploads** — IndexedDB upload queue size

## Battery Optimization

`useBatteryStatus` reads the Battery Status API when available. When charge is ≤20% and not plugged in, `useOfflineQueueSync` pauses automatic drain to conserve power.

## Storage Monitoring

`useStorageEstimate` combines `navigator.storage.estimate()` with localStorage size for a practical usage snapshot.

## Compression

When low data mode is enabled, `compressImageFile()` resizes images (max 1600px) and re-encodes as JPEG before upload.

## App Lock

Collectors can set a 6-digit PIN for idle lock (`appLockStore`). PIN hash is stored locally; remote PIN reset requires a future trusted-device registry.

## Related

- [Offline Architecture](./offline-architecture.md)
- [Mobile Guide](./mobile-guide.md)
- [Security Guide](./security-guide.md)
