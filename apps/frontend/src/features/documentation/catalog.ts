export type DocCategory =
  | 'product'
  | 'technical'
  | 'financial'
  | 'operations'
  | 'guides'
  | 'developer'
  | 'security'
  | 'reporting'
  | 'notifications'
  | 'roadmap'
  | 'procurement';

export interface DocumentationBook {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: DocCategory;
  /** Path under /documentation/ for Markdown (public sync). */
  markdownPath: string;
  /** Filename under /documentation/pdf/ */
  pdfFile: string;
  /** Filename under /documentation/docx/ */
  docxFile: string;
  audience: string;
  estimatedPages: number;
  version: string;
  classification: 'Confidential' | 'Internal' | 'Restricted';
}

export const DOC_VERSIONS = ['1.7.4', '1.7.3', '1.7.2', '1.7.1', '1.7.0'] as const;
export type DocVersion = (typeof DOC_VERSIONS)[number];
export const CURRENT_DOC_VERSION: DocVersion = '1.7.4';

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  product: 'Product',
  technical: 'Technical',
  financial: 'Financial',
  operations: 'Operations',
  guides: 'User Guides',
  developer: 'Developer',
  security: 'Security',
  reporting: 'Reporting',
  notifications: 'Notifications',
  roadmap: 'Roadmap',
  procurement: 'Procurement',
};

export const DOCUMENTATION_BOOKS: DocumentationBook[] = [
  {
    id: 'product-book',
    title: 'WILMS Product Book',
    shortTitle: 'Product Book',
    description:
      'Master reference covering vision, domain model, financial engine, workflows, RBAC, and release history through v1.7.2.',
    category: 'product',
    markdownPath: 'books/WILMS_PRODUCT_BOOK.md',
    pdfFile: 'WILMS_PRODUCT_BOOK.pdf',
    docxFile: 'WILMS_PRODUCT_BOOK.docx',
    audience: 'All stakeholders',
    estimatedPages: 120,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'financial-engine',
    title: 'Financial Engine Book',
    shortTitle: 'Financial Engine',
    description:
      'Pool accounting, operating cash, disbursement, repayment, reconciliation, write-offs, and ledger behaviour.',
    category: 'financial',
    markdownPath: 'books/FINANCIAL_ENGINE_BOOK.md',
    pdfFile: 'FINANCIAL_ENGINE_BOOK.pdf',
    docxFile: 'FINANCIAL_ENGINE_BOOK.docx',
    audience: 'Finance, auditors, technical leads',
    estimatedPages: 28,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'business-requirements',
    title: 'Business Requirements Book',
    shortTitle: 'Business Requirements',
    description: 'Functional and non-functional requirements with implementation status.',
    category: 'product',
    markdownPath: 'books/BUSINESS_REQUIREMENTS_BOOK.md',
    pdfFile: 'BUSINESS_REQUIREMENTS_BOOK.pdf',
    docxFile: 'BUSINESS_REQUIREMENTS_BOOK.docx',
    audience: 'Product owners, procurement',
    estimatedPages: 36,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'technical-architecture',
    title: 'Technical Architecture Guide',
    shortTitle: 'Technical Architecture',
    description: 'Frontend, domain, deployment, authentication, and operational architecture.',
    category: 'technical',
    markdownPath: 'technical/TECHNICAL_ARCHITECTURE_GUIDE.md',
    pdfFile: 'TECHNICAL_ARCHITECTURE_GUIDE.pdf',
    docxFile: 'TECHNICAL_ARCHITECTURE_GUIDE.docx',
    audience: 'Engineering, DevOps',
    estimatedPages: 40,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'security-compliance',
    title: 'Security & Compliance Book',
    shortTitle: 'Security & Compliance',
    description: 'Sessions, RBAC, SoD, audit logging, hardening, and compliance controls.',
    category: 'security',
    markdownPath: 'books/SECURITY_COMPLIANCE_BOOK.md',
    pdfFile: 'SECURITY_COMPLIANCE_BOOK.pdf',
    docxFile: 'SECURITY_COMPLIANCE_BOOK.docx',
    audience: 'Security reviewers, auditors',
    estimatedPages: 32,
    version: CURRENT_DOC_VERSION,
    classification: 'Restricted',
  },
  {
    id: 'reporting-analytics',
    title: 'Reporting & Analytics Book',
    shortTitle: 'Reporting & Analytics',
    description: 'Operational reports, executive intelligence, forecasting, and export behaviour.',
    category: 'reporting',
    markdownPath: 'books/REPORTING_ANALYTICS_BOOK.md',
    pdfFile: 'REPORTING_ANALYTICS_BOOK.pdf',
    docxFile: 'REPORTING_ANALYTICS_BOOK.docx',
    audience: 'Finance, programme managers',
    estimatedPages: 28,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'notifications',
    title: 'Notification & Communication Book',
    shortTitle: 'Notifications',
    description: 'In-app, email, SMS, campaigns, quiet hours, retries, and escalation.',
    category: 'notifications',
    markdownPath: 'books/NOTIFICATION_COMMUNICATION_BOOK.md',
    pdfFile: 'NOTIFICATION_COMMUNICATION_BOOK.pdf',
    docxFile: 'NOTIFICATION_COMMUNICATION_BOOK.docx',
    audience: 'Operations, communications',
    estimatedPages: 24,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'operations',
    title: 'Operations Manual',
    shortTitle: 'Operations',
    description: 'Deployment, migrations, backups, incidents, release and rollback runbooks.',
    category: 'operations',
    markdownPath: 'operations/OPERATIONS_MANUAL.md',
    pdfFile: 'OPERATIONS_MANUAL.pdf',
    docxFile: 'OPERATIONS_MANUAL.docx',
    audience: 'Operations teams',
    estimatedPages: 30,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'admin-manual',
    title: 'Administrator Manual',
    shortTitle: 'Administrator',
    description: 'Super Admin daily workflows, settings, users, and oversight.',
    category: 'guides',
    markdownPath: 'user-guides/SUPER_ADMIN_MANUAL.md',
    pdfFile: 'ADMINISTRATOR_MANUAL.pdf',
    docxFile: 'ADMINISTRATOR_MANUAL.docx',
    audience: 'Super Admin',
    estimatedPages: 22,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'collector-manual',
    title: 'Collector Manual',
    shortTitle: 'Collector',
    description: 'Field collections, reconciliation, expenses, and offline guidance.',
    category: 'guides',
    markdownPath: 'user-guides/COLLECTOR_MANUAL.md',
    pdfFile: 'COLLECTOR_MANUAL.pdf',
    docxFile: 'COLLECTOR_MANUAL.docx',
    audience: 'Collectors',
    estimatedPages: 18,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'officer-manual',
    title: 'Registration Officer Manual',
    shortTitle: 'Officer',
    description: 'Borrower registration, KYC capture, and submission tracking.',
    category: 'guides',
    markdownPath: 'user-guides/OFFICER_MANUAL.md',
    pdfFile: 'OFFICER_MANUAL.pdf',
    docxFile: 'OFFICER_MANUAL.docx',
    audience: 'Registration Officers',
    estimatedPages: 16,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'approver-manual',
    title: 'Approver Manual',
    shortTitle: 'Approver',
    description: 'Application review, maker-checker expectations, and offline sync.',
    category: 'guides',
    markdownPath: 'user-guides/APPROVER_MANUAL.md',
    pdfFile: 'APPROVER_MANUAL.pdf',
    docxFile: 'APPROVER_MANUAL.docx',
    audience: 'Approvers',
    estimatedPages: 16,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'auditor-manual',
    title: 'Auditor Manual',
    shortTitle: 'Auditor',
    description: 'Read-only reports, audit log review, and compliance exports.',
    category: 'guides',
    markdownPath: 'user-guides/AUDITOR_MANUAL.md',
    pdfFile: 'AUDITOR_MANUAL.pdf',
    docxFile: 'AUDITOR_MANUAL.docx',
    audience: 'Auditors',
    estimatedPages: 14,
    version: CURRENT_DOC_VERSION,
    classification: 'Restricted',
  },
  {
    id: 'developer-guide',
    title: 'Developer Guide',
    shortTitle: 'Developer Guide',
    description: 'Repository structure, testing, migrations, and contribution workflow.',
    category: 'developer',
    markdownPath: 'developer/DEVELOPER_GUIDE.md',
    pdfFile: 'DEVELOPER_GUIDE.pdf',
    docxFile: 'DEVELOPER_GUIDE.docx',
    audience: 'Engineers',
    estimatedPages: 34,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    shortTitle: 'API Reference',
    description: 'Endpoint catalogue, authentication, errors, and permission notes.',
    category: 'developer',
    markdownPath: 'technical/API_REFERENCE.md',
    pdfFile: 'API_REFERENCE.pdf',
    docxFile: 'API_REFERENCE.docx',
    audience: 'Integrators',
    estimatedPages: 40,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
  {
    id: 'roadmap',
    title: 'Roadmap & Future Work',
    shortTitle: 'Roadmap',
    description: 'Deferred capabilities, integrations, platform evolution, and effort estimates.',
    category: 'roadmap',
    markdownPath: 'roadmap/ROADMAP_FUTURE_WORK_BOOK.md',
    pdfFile: 'ROADMAP_FUTURE_WORK_BOOK.pdf',
    docxFile: 'ROADMAP_FUTURE_WORK_BOOK.docx',
    audience: 'Leadership, product',
    estimatedPages: 36,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'product-dossier',
    title: 'Product Dossier',
    shortTitle: 'Product Dossier',
    description: 'Concise institutional briefing for partners and investors.',
    category: 'procurement',
    markdownPath: 'books/PRODUCT_DOSSIER.md',
    pdfFile: 'PRODUCT_DOSSIER.pdf',
    docxFile: 'PRODUCT_DOSSIER.docx',
    audience: 'Investors, partners',
    estimatedPages: 12,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'procurement-pack',
    title: 'Procurement Pack',
    shortTitle: 'Procurement',
    description: 'Evaluation-oriented pack for procurement committees and RFP responses.',
    category: 'procurement',
    markdownPath: 'books/PROCUREMENT_PACK.md',
    pdfFile: 'PROCUREMENT_PACK.pdf',
    docxFile: 'PROCUREMENT_PACK.docx',
    audience: 'Procurement committees',
    estimatedPages: 16,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'board-presentation',
    title: 'Board Presentation',
    shortTitle: 'Board Presentation',
    description: 'Board-ready narrative of portfolio health, controls, and roadmap.',
    category: 'product',
    markdownPath: 'books/BOARD_PRESENTATION.md',
    pdfFile: 'BOARD_PRESENTATION.pdf',
    docxFile: 'BOARD_PRESENTATION.docx',
    audience: 'Directors, NGO boards',
    estimatedPages: 10,
    version: CURRENT_DOC_VERSION,
    classification: 'Confidential',
  },
  {
    id: 'implementation-guide',
    title: 'Implementation Guide',
    shortTitle: 'Implementation',
    description: 'Rollout checklist, environment setup, and handover guidance.',
    category: 'operations',
    markdownPath: 'books/IMPLEMENTATION_GUIDE.md',
    pdfFile: 'IMPLEMENTATION_GUIDE.pdf',
    docxFile: 'IMPLEMENTATION_GUIDE.docx',
    audience: 'Implementation partners',
    estimatedPages: 20,
    version: CURRENT_DOC_VERSION,
    classification: 'Internal',
  },
];

export function getDocumentationBook(id: string): DocumentationBook | undefined {
  return DOCUMENTATION_BOOKS.find((book) => book.id === id);
}

export function documentationAssetUrl(
  kind: 'markdown' | 'pdf' | 'docx',
  book: DocumentationBook,
): string {
  if (kind === 'markdown') {
    return `/documentation/${book.markdownPath}`;
  }
  if (kind === 'pdf') {
    return `/documentation/pdf/${book.pdfFile}`;
  }
  return `/documentation/docx/${book.docxFile}`;
}

export const DOCUMENTATION_STATS = {
  bookCount: DOCUMENTATION_BOOKS.length,
  estimatedPages: DOCUMENTATION_BOOKS.reduce((sum, book) => sum + book.estimatedPages, 0),
  status: 'Published',
  lastUpdated: 'August 2026',
  platformBaseline: 'v1.7.2',
  libraryVersion: CURRENT_DOC_VERSION,
} as const;
