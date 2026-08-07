/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.7.3',
  summary:
    'Official documentation library — comprehensive books, role manuals, branded PDF/DOCX exports, and contextual export simplification.',
  highlights: [
    'Full documentation library under documentation/ with product book, BRD, security, and API reference.',
    'Branded PDF and DOCX generation via npm run docs:generate for all official manuals.',
    'Five role-based user guides: Super Admin, Officer, Collector, Approver, Auditor.',
    'Standalone Export Center removed; contextual exports from reports and intelligence surfaces.',
  ],
};
