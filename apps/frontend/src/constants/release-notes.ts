/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.8.1',
  summary:
    'Production maintenance: settings enforcement, notification timing, borrower records, and workflow corrections.',
  highlights: [
    'Group capacity and community formation now follow saved system settings.',
    'Borrowers are not SMS’d on pending group assignment; congratulations wait for approval.',
    'Borrower Record Centre, guarantor SMS, and the public loan workflow stepper.',
    'GPS digital-address placeholder only — GhanaPost integration is not included.',
  ],
};
