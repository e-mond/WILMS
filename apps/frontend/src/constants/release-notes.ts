/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.7.5',
  summary:
    'Offline-ready field operations, holiday requests, push alerts, modern dashboards, and stronger App Lock.',
  highlights: [
    'Field-critical offline for every role with sync status and conflict review.',
    'Collectors can request holidays; approvers review with maker-checker before schedule apply.',
    'Web Push for approvals, holiday status, sync conflicts, and reconciliation alerts.',
    'Modern dashboard widgets and Product Tour steps for Offline, Push, Holidays, and App Lock.',
  ],
};
