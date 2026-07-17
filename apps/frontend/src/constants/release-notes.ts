/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.3.8',
  summary: 'Final hardening — toast reliability, guided tour, skeleton loaders, permission overrides, and security fixes.',
  highlights: [
    'Notification toasts no longer duplicate on login, refresh, or tab focus.',
    'Mandatory first-login product tour with Help FAB for replay.',
    'Skeleton loaders replace page-level spinners to reduce layout shift.',
    'Individual permission overrides for Super Admins without changing roles.',
    'Security hardening for messaging IDOR, notification send, uploads, and webhooks.',
  ],
};
