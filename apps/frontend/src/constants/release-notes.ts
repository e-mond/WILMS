/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.7.2',
  summary:
    'Release candidate stabilization — financial-grade dashboard, board executive view, Export Center actions, and Product Tour 2.0.',
  highlights: [
    'Operational dashboard: reconciliation aging, activity summary feed, financial color identity.',
    'Executive Intelligence presentation polish for board-ready reviews.',
    'Export Center job actions: download, preview, regenerate, delete, share, and copy link.',
    'Product Tour 2.0 with welcome, spotlight, and completion checklist.',
  ],
};
