/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.8.0',
  summary:
    'Enterprise design refresh, Ghana holidays, full offline readiness, and workflow automation.',
  highlights: [
    'Self-hosted fonts with CSP-safe loading and hardened holiday request APIs.',
    'Automatic Ghana public holidays with a single premium calendar experience.',
    'iOS-inspired dashboards, unique module icons, and offline-first field operations.',
    'Automation engine for reminders, follow-ups, escalations, and scheduled executive reports.',
  ],
};
