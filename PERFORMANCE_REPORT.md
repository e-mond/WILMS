# Performance Report — v1.3.0

## Improvements

- Service worker caches static shell assets for faster repeat loads in the field
- Background upload processor avoids blocking UI during connectivity recovery
- Sync interval respects collector preferences to reduce duplicate network calls
- Image compression in low-data mode reduces upload payload size

## Recommendations

- Add `@tanstack/react-virtual` for large borrower tables (v1.3.1)
- Persist TanStack Query cache for collector read models offline
- Bulk missed-week marking to reduce write-on-read queries
