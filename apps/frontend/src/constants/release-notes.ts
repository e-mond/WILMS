/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.4.0',
  summary:
    'Platform foundation — durable job queues, financial idempotency hardening, cursor pagination, and stronger observability.',
  highlights: [
    'Optional Redis/BullMQ background jobs with safe in-process fallback.',
    'Stronger Idempotency-Key handling for money mutations (required in production).',
    'Cursor pagination available for borrower lists.',
    'Operations dashboard shows queue mode and feature flags.',
    'Node.js 22 standardized across Docker, CI, and engines.',
  ],
};
