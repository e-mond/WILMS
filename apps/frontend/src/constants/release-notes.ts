/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.3.3',
  summary: 'Stability fixes for navigation, caching, and user management.',
  highlights: [
    'Service worker no longer breaks page navigation or serves stale app chunks.',
    'In-app update prompt lets you choose when to reload after a deployment.',
    'Invited users now show the correct status after signing in.',
    'Audit log loading and table layout improvements.',
    'Sign-in page redesigned with trust strip, caps lock warning, and user-controlled update flow.',
  ],
};
