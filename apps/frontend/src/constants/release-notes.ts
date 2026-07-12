/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.3.7-rc1',
  summary: 'Production stabilisation RC — bug fixes, mock guard, and health diagnostics.',
  highlights: [
    'Collector settings consolidated to a single App Lock section.',
    'Admin collector messaging opens conversations reliably.',
    'Health endpoint reports explicit degradedReasons for pending migrations.',
    'Production builds always use live API services (no mock data).',
  ],
};
