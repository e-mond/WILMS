export const OFFLINE_QUEUE_STORAGE_KEY = 'wilms-offline-queue';

/** ADR-001: warn Collector when queue exceeds this count without draining. */
export const OFFLINE_QUEUE_WARNING_THRESHOLD = 100;

/** REQ-084: retry pending items while online (well within 15-minute sync window). */
export const OFFLINE_SYNC_RETRY_INTERVAL_MS = 60_000;
