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
  collectorDashboard: {
    title: 'Collector dashboard',
    body: 'Your daily command centre for field collections. Review groups due today, record payments, and monitor reconciliation status.',
    example: 'Start with Today\'s Groups, then record payments for borrowers marked pending.',
  },
  collectorMyBorrowers: {
    title: 'Assigned borrowers',
    body: 'All borrowers on your collection route with repayment status. Search by name, phone, or ID to find a borrower quickly.',
    example: 'Open a borrower to record a payment or review their loan balance.',
  },
  collectorReconciliation: {
    title: 'End-of-day reconciliation',
    body: 'Submit physical cash totals against system expectations. Variances above the threshold require a supervisor comment.',
    example: 'Reconcile after completing today\'s collections before leaving the field.',
  },
  collectorAdminFee: {
    title: 'Admin fee collection',
    body: 'Administrative fees must be recorded before a loan can be disbursed. Collect the fee in the field, then unlock disbursement.',
    example: 'Select a borrower from the queue and record the admin fee payment.',
  },
  collectorExpenses: {
    title: 'Field expenses',
    body: 'Log transport and other collection-related expenses for audit and reimbursement tracking.',
    example: 'Record expenses on the same day as the collection activity.',
  },
  approverPending: {
    title: 'Approval queue',
    body: 'Review new borrower applications submitted by registration officers. Approve, reject with reason, or blacklist when required.',
    example: 'Open the next application and verify KYC documents before deciding.',
  },
  approverReviewed: {
    title: 'Review history',
    body: 'A record of every application you have approved or rejected, searchable by borrower name or community.',
    example: 'Use this list to answer questions about past approval decisions.',
  },
  officerRegister: {
    title: 'Borrower registration',
    body: 'Capture identity, guarantor, documents, and location for new borrowers. Progress saves automatically between steps.',
    example: 'Complete all required fields before submitting for approver review.',
  },
  officerRegistrations: {
    title: 'My registrations',
    body: 'Track every application you have submitted and its current approval status.',
    example: 'Filter by Pending to see applications still awaiting approver action.',
  },
  dashboard: {
    title: 'Executive dashboard',
    body: 'Portfolio KPIs, collection performance, risk distribution, and recent alerts. Use quick actions for the most common supervisor tasks.',
    example: 'Review Recent Activity first to see what needs attention today.',
  },
} as const;

export type PageGuidanceKey = keyof typeof PAGE_GUIDANCE;
