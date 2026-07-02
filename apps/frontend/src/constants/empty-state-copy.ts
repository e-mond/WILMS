export const EMPTY_STATE_COPY = {
  borrowers: {
    title: 'No borrowers yet',
    description: 'Registered borrowers will appear here after submission and approval.',
  },
  loans: {
    title: 'No loans yet',
    description: 'Originated loans will appear here once disbursement begins.',
  },
  loanPools: {
    title: 'No loan pools yet',
    description: 'Create a funding pool to allocate capital for loan disbursement.',
  },
  groups: {
    title: 'No groups yet',
    description: 'Form a lending group once borrowers are ready to be assigned.',
  },
  collectors: {
    title: 'No collectors yet',
    description: 'Add collectors to assign field collection routes and borrowers.',
  },
  applications: {
    title: 'No pending applications',
    description: 'New borrower submissions will appear here for review.',
  },
  reviewedApplications: {
    title: 'No reviewed applications yet',
    description: 'Applications you approve or reject will be listed here.',
  },
  payments: {
    title: 'No payments recorded',
    description: 'Repayments will appear here after collection is posted.',
  },
  reports: {
    title: 'No report data yet',
    description: 'Reports will populate once operational and financial activity exists.',
  },
  notifications: {
    title: 'No notifications',
    description: 'Alerts and inbox messages will appear here when generated.',
  },
  riskFlags: {
    title: 'No risk flags',
    description: 'Raised risk signals will appear here for triage and resolution.',
  },
  adjustments: {
    title: 'No adjustments pending',
    description: 'Ledger adjustments requiring review will appear here.',
  },
  registrations: {
    title: 'No registrations yet',
    description: 'Your submitted borrower registrations will appear here.',
  },
  reconciliation: {
    title: 'No reconciliation data',
    description: 'Select a collection date to review or submit reconciliation totals.',
  },
  dashboard: {
    title: 'No dashboard activity yet',
    description: 'KPIs and summaries will appear once borrowers, loans, and collections exist.',
  },
  settings: {
    title: 'Settings unavailable',
    description: 'System settings could not be loaded right now.',
  },
  collectorsDashboard: {
    title: 'No collection assignments yet',
    description: 'Assigned groups and borrowers will appear here once configured.',
  },
  adminFeeQueue: {
    title: 'No admin fees due',
    description: 'Borrowers awaiting administrative fee collection will appear here.',
  },
  overpayments: {
    title: 'No overpayment reviews',
    description: 'Overpayment cases requiring approval will appear here.',
  },
} as const;
