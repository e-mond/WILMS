/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.4.3',
  summary:
    'Critical financial workflow hotfix — disbursement lifecycle gating, Idempotency-Key on money mutations, review group display, and admin-fee confirmation notifications.',
  highlights: [
    'Disburse only when the loan is approved and pending disbursement; workflow stepper shows progress.',
    'Reconciliation, payments, disbursement, and adjustments send Idempotency-Key automatically.',
    'Approver review shows Group as GRP-… — Name and Assign Group persists membership.',
    'Admin fee recording sends confirmation SMS/email without duplicates.',
  ],
};
