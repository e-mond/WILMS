const EXACT_DESCRIPTIONS: Record<string, string> = {
  '/dashboard':
    'Monitor portfolio health, collections, risk signals, and quick actions across the programme.',
  '/borrowers':
    'Review registered borrowers, track approval status, and open profiles for loan servicing.',
  '/loan-pools':
    'Manage funding sources used for loan disbursement and monitor available capital, utilisation, and repayments.',
  '/loans':
    'Track active and completed loans, monitor balances, and originate new lending cycles.',
  '/loans/new':
    'Originate a new loan by selecting an approved borrower and configuring cycle terms.',
  '/collectors':
    'Manage field collectors, assignments, and collection performance across regions.',
  '/groups':
    'Organise borrowers into lending groups, monitor membership, and review group risk.',
  '/risk-flags':
    'Review borrower, group, and loan risk signals raised during operations.',
  '/adjustments':
    'Approve or reject ledger adjustments that require supervisory review.',
  '/settings':
    'Configure organisation settings, users, security policy, and integrations.',
  '/reports':
    'Generate operational and financial reports for audits, collections, and portfolio review.',
  '/reports/loan-portfolio':
    'Analyse outstanding balances, disbursements, and portfolio composition.',
  '/reports/daily-collection':
    'Review daily collection totals, variances, and collector performance.',
  '/reports/defaulters':
    'Identify borrowers and loans with missed repayments or elevated default risk.',
  '/reports/collector-performance':
    'Compare expected versus actual collections by collector.',
  '/reports/group-risk':
    'Review group-level risk distribution and flagged communities.',
  '/reports/financial-ledger':
    'Inspect ledger movements for audit and reconciliation.',
  '/reports/audit-log':
    'Browse immutable audit events for compliance and investigations.',
  '/officer/register':
    'Capture KYC details, documents, and geolocation for new borrower onboarding.',
  '/officer/my-registrations':
    'Track submissions you have registered and their approval status.',
  '/approver/pending':
    'Review borrower applications awaiting approval decisions.',
  '/approver/reviewed':
    'Browse applications you have already approved or rejected.',
  '/collector/dashboard':
    "See today's collection targets, assigned groups, and field priorities.",
  '/collector/my-borrowers':
    'View borrowers assigned to you and their repayment status.',
  '/collector/admin-fee':
    'Record administrative fees collected from borrowers in the field.',
  '/collector/reconciliation':
    'Submit end-of-day reconciliation totals and resolve collection variances.',
  '/collector/security':
    'Configure app lock and device security for field collection work.',
  '/collector/expenses':
    'Log field expenses tied to collection activities.',
  '/auditor/audit-log':
    'Read-only audit trail for compliance and oversight reviews.',
  '/auditor/reports':
    'Access read-only operational reports without mutating data.',
};

const PREFIX_DESCRIPTIONS: Array<{ test: (pathname: string) => boolean; description: string }> = [
  {
    test: (pathname) => pathname.startsWith('/borrowers/'),
    description: 'Review borrower identity, loans, and servicing history.',
  },
  {
    test: (pathname) => pathname.startsWith('/loans/'),
    description: 'Inspect loan terms, schedule, repayments, and servicing actions.',
  },
  {
    test: (pathname) => pathname.startsWith('/collectors/'),
    description: 'Review collector profile, assignments, and performance.',
  },
  {
    test: (pathname) => pathname.startsWith('/groups/'),
    description: 'Review group membership, leaders, and collection health.',
  },
  {
    test: (pathname) => pathname.startsWith('/approver/pending/'),
    description: 'Evaluate application details before approving or rejecting.',
  },
  {
    test: (pathname) => pathname.startsWith('/collector/payment/'),
    description: 'Record a repayment against an assigned borrower loan.',
  },
];

export function resolveShellPageDescription(pathname: string): string | undefined {
  if (EXACT_DESCRIPTIONS[pathname]) {
    return EXACT_DESCRIPTIONS[pathname];
  }

  for (const entry of PREFIX_DESCRIPTIONS) {
    if (entry.test(pathname)) {
      return entry.description;
    }
  }

  return undefined;
}
