import { PageShell } from '@/components/layout/PageShell';

interface DocBook {
  title: string;
  path: string;
  audience: string;
  category: 'primary' | 'technical' | 'operations' | 'role' | 'roadmap';
}

const PRIMARY_BOOKS: DocBook[] = [
  {
    title: 'WILMS Product Book',
    path: 'documentation/books/WILMS_PRODUCT_BOOK.md',
    audience: 'All stakeholders — master reference',
    category: 'primary',
  },
  {
    title: 'Financial Engine Book',
    path: 'documentation/books/FINANCIAL_ENGINE_BOOK.md',
    audience: 'Finance, auditors, technical leads',
    category: 'primary',
  },
  {
    title: 'Business Requirements Book',
    path: 'documentation/books/BUSINESS_REQUIREMENTS_BOOK.md',
    audience: 'Product owners, procurement, auditors',
    category: 'primary',
  },
  {
    title: 'Security & Compliance Book',
    path: 'documentation/books/SECURITY_COMPLIANCE_BOOK.md',
    audience: 'Security reviewers, compliance officers',
    category: 'primary',
  },
  {
    title: 'Reporting & Analytics Book',
    path: 'documentation/books/REPORTING_ANALYTICS_BOOK.md',
    audience: 'Finance, programme managers, board',
    category: 'primary',
  },
  {
    title: 'Notification & Communication Book',
    path: 'documentation/books/NOTIFICATION_COMMUNICATION_BOOK.md',
    audience: 'Operations, communications leads',
    category: 'primary',
  },
  {
    title: 'Product Dossier',
    path: 'documentation/books/PRODUCT_DOSSIER.md',
    audience: 'Investors, partners, executive briefings',
    category: 'primary',
  },
  {
    title: 'Board Presentation',
    path: 'documentation/books/BOARD_PRESENTATION.md',
    audience: 'Directors, NGO boards',
    category: 'primary',
  },
  {
    title: 'Procurement Pack',
    path: 'documentation/books/PROCUREMENT_PACK.md',
    audience: 'Procurement committees, RFP evaluators',
    category: 'primary',
  },
  {
    title: 'Implementation Guide',
    path: 'documentation/books/IMPLEMENTATION_GUIDE.md',
    audience: 'Deployment and rollout teams',
    category: 'primary',
  },
];

const TECHNICAL_DOCS: DocBook[] = [
  {
    title: 'Technical Architecture Guide',
    path: 'documentation/technical/TECHNICAL_ARCHITECTURE_GUIDE.md',
    audience: 'Engineering, DevOps',
    category: 'technical',
  },
  {
    title: 'API Reference',
    path: 'documentation/technical/API_REFERENCE.md',
    audience: 'Integrators, backend engineers',
    category: 'technical',
  },
  {
    title: 'Developer Guide',
    path: 'documentation/developer/DEVELOPER_GUIDE.md',
    audience: 'Contributors, maintainers',
    category: 'technical',
  },
];

const ROLE_MANUALS: DocBook[] = [
  {
    title: 'Administrator Manual',
    path: 'documentation/user-guides/SUPER_ADMIN_MANUAL.md',
    audience: 'Super Admin role',
    category: 'role',
  },
  {
    title: 'Registration Officer Manual',
    path: 'documentation/user-guides/OFFICER_MANUAL.md',
    audience: 'Registration Officer role',
    category: 'role',
  },
  {
    title: 'Collector Manual',
    path: 'documentation/user-guides/COLLECTOR_MANUAL.md',
    audience: 'Collector role',
    category: 'role',
  },
  {
    title: 'Approver Manual',
    path: 'documentation/user-guides/APPROVER_MANUAL.md',
    audience: 'Approver role',
    category: 'role',
  },
  {
    title: 'Auditor Manual',
    path: 'documentation/user-guides/AUDITOR_MANUAL.md',
    audience: 'Auditor role',
    category: 'role',
  },
];

function DocSection({ title, books }: { title: string; books: DocBook[] }) {
  return (
    <section className="space-y-wilms-3">
      <h2 className="text-heading-sm font-semibold text-text-primary">{title}</h2>
      <ul className="divide-y divide-border-subtle rounded-wilms-lg border border-border-subtle bg-surface-raised">
        {books.map((book) => (
          <li key={book.path} className="px-wilms-4 py-wilms-3">
            <p className="font-medium text-text-primary">{book.title}</p>
            <p className="mt-1 text-body-sm text-text-muted">{book.audience}</p>
            <p className="mt-1 font-mono text-body-sm text-text-muted">{book.path}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DocumentationPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-wilms-8">
        <header className="space-y-wilms-2">
          <p className="text-body-sm font-medium uppercase tracking-wide text-brand-primary">
            Documentation Library v1.7.3
          </p>
          <h1 className="text-heading-lg font-semibold text-text-primary">
            Official WILMS Documentation
          </h1>
          <p className="max-w-3xl text-body text-text-muted">
            Authoritative catalogue of platform documentation through release v1.7.3. Platform
            features are documented through v1.7.2; v1.7.3 delivers this library, contextual
            exports (standalone Export Center removed), and this read-only portal. Source markdown
            lives in the repository under <code className="text-body-sm">documentation/</code>;
            branded PDF and DOCX artefacts are generated via{' '}
            <code className="text-body-sm">npm run docs:generate</code>.
          </p>
        </header>

        <aside className="rounded-wilms-lg border border-border-subtle bg-surface-muted px-wilms-4 py-wilms-3 text-body-sm text-text-muted">
          <strong className="text-text-primary">Index:</strong>{' '}
          documentation/DOCUMENTATION_LIBRARY_INDEX.md — master catalogue with format locations (
          documentation/pdf/, documentation/docx/).
        </aside>

        <DocSection title="Primary books" books={PRIMARY_BOOKS} />
        <DocSection title="Technical documentation" books={TECHNICAL_DOCS} />
        <DocSection title="Role-based user guides" books={ROLE_MANUALS} />

        <section className="space-y-wilms-3">
          <h2 className="text-heading-sm font-semibold text-text-primary">Operations &amp; roadmap</h2>
          <ul className="divide-y divide-border-subtle rounded-wilms-lg border border-border-subtle bg-surface-raised">
            <li className="px-wilms-4 py-wilms-3">
              <p className="font-medium text-text-primary">Operations Manual</p>
              <p className="mt-1 font-mono text-body-sm text-text-muted">
                documentation/operations/OPERATIONS_MANUAL.md
              </p>
            </li>
            <li className="px-wilms-4 py-wilms-3">
              <p className="font-medium text-text-primary">Roadmap — Future Work</p>
              <p className="mt-1 font-mono text-body-sm text-text-muted">
                documentation/roadmap/ROADMAP_FUTURE_WORK_BOOK.md
              </p>
            </li>
          </ul>
        </section>

        <footer className="border-t border-border-subtle pt-wilms-4 text-body-sm text-text-muted">
          CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official
          record keeping only.
        </footer>
      </div>
    </PageShell>
  );
}
