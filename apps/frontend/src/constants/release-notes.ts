/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.4.2',
  summary:
    'Phase 27 hardening — signed invitation tokens, expense maker-checker, SQL-scoped financial reports, and API rate limiting.',
  highlights: [
    'Invitation accept links require a one-time signed token (not email alone).',
    'Expenses submit as pending and need a different reviewer before affecting operating cash.',
    'Daily collection and ledger reports use date-scoped database queries.',
    'Global API rate limiting protects against abuse (Redis-backed when configured).',
  ],
};
