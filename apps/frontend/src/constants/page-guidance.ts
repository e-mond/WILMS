export const PAGE_GUIDANCE = {
  loanPools: {
    title: 'How loan pools work',
    body: 'Loan pools hold the capital used for disbursements. Each pool tracks available balance, utilisation, and repayments flowing back into the pool.',
    example: 'Create an operating pool first, then originate loans against it.',
  },
  collectors: {
    title: 'Managing collectors',
    body: 'Collectors are assigned groups and borrowers for weekly field collections. Monitor performance and reconcile daily totals here.',
    example: 'Onboard a collector, assign groups, then review collection rates on the dashboard.',
  },
  riskFlags: {
    title: 'Risk flag triage',
    body: 'Risk flags surface missed payments, duplicate registrations, group escalations, and other operational signals that need review.',
    example: 'Resolve or acknowledge flags to keep portfolio risk visible to supervisors.',
  },
  reports: {
    title: 'Choosing a report',
    body: 'Reports are read-only views for audits, collections, portfolio health, and compliance. Export when you need to share evidence offline.',
    example: 'Start with Daily Collection or Loan Portfolio for operational reviews.',
  },
  adjustments: {
    title: 'Adjustment approvals',
    body: 'Ledger adjustments require supervisory approval before they post. Review the reason, affected borrower, and audit trail before deciding.',
    example: 'Payment corrections after the collection day end here as adjustment requests.',
  },
  groups: {
    title: 'Group lending',
    body: 'Borrowers are organised into groups for joint liability and collection routing. Monitor membership, leaders, and group risk levels.',
    example: 'Form a group once enough approved borrowers are ready to be assigned.',
  },
  borrowers: {
    title: 'Borrower lifecycle',
    body: 'Track registrations from submission through approval, disbursement, collections, and closure. Open a profile for full history.',
    example: 'Filter by Pending to review applications awaiting approval.',
  },
  loans: {
    title: 'Loan portfolio',
    body: 'Active and completed loans appear here with balances and status. Originate new loans only for approved borrowers with admin fees recorded.',
    example: 'Use New Loan after admin fee collection unlocks disbursement.',
  },
} as const;

export type PageGuidanceKey = keyof typeof PAGE_GUIDANCE;
