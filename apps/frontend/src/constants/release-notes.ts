/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.4.1',
  summary:
    'UX shell hardening — distinct Dashboard vs Operations, sticky enterprise chrome, command search, permission catalog redesign, and floating-action collision fix.',
  highlights: [
    'Dashboard and Operations are distinct Super Admin destinations with correct RBAC routing.',
    'Sticky header and sidebar shell with grouped navbar actions.',
    'Shared floating-action stack prevents Help and connectivity overlap.',
    'Permission Catalog redesigned as searchable category rows.',
    'Global search upgraded toward a keyboard command palette.',
  ],
};
