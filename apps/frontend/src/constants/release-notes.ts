/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.7.4',
  summary:
    'Documentation Centre — read, search, print, and download the official WILMS product library inside the application.',
  highlights: [
    'Enterprise Documentation Centre with book-quality reading layout and interactive contents.',
    'Search across the full documentation library with section snippets.',
    'Download PDF and Word editions directly from the app; presentation mode for board reviews.',
    'Accessible from the Super Admin sidebar and Settings → Documentation.',
  ],
};
