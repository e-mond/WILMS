/**
 * Expand WILMS Product Book and generate Financial Engine Book.
 * Run: node scripts/expand-documentation-books.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const booksDir = path.join(root, 'documentation', 'books');

const FOOTER =
  '\n\n---\n\n*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*\n';

const MODULES = [
  {
    id: 'auth',
    name: 'Authentication & Sessions',
    purpose: 'Custom HMAC-signed session cookies secure all browser sessions.',
    capabilities: [
      'Login with email and password',
      'Optional login OTP challenge',
      'Password reset with time-limited tokens',
      'Session activity validation on each request',
      'Force-logout for security incidents',
      'Login rate limiting at IP and account level',
      'Onboarding flows for new users',
    ],
    roles: ['All production roles'],
    routes: ['/login', '/forgot-password', '/reset-password', '/onboarding'],
    api: ['POST /auth/login', 'POST /auth/logout', 'GET /auth/session', 'POST /auth/forgot-password'],
  },
  {
    id: 'borrowers',
    name: 'Borrower Management',
    purpose: 'Structured registration, document capture, and profile lifecycle.',
    capabilities: [
      'Multi-step registration with KYC fields',
      'Document upload with type allowlist',
      'Signature capture',
      'GPS-verified location recording',
      'Pending registration queue',
      'Profile export actions',
      'Borrower search and filtering',
    ],
    roles: ['Registration Officer', 'Super Admin', 'Collector (view assigned)', 'Approver (review)'],
    routes: ['/borrowers', '/borrowers/[id]', '/officer/register', '/officer/my-registrations'],
    api: ['GET/POST /borrowers', 'GET/PATCH /borrowers/:id', 'POST /borrowers/:id/documents'],
  },
  {
    id: 'loans',
    name: 'Loan Lifecycle',
    purpose: 'Application through approval, admin fee, disbursement, and servicing.',
    capabilities: [
      'Loan application submission',
      'Approver side-by-side review',
      'Admin fee confirmation gate',
      'Pool capital hard-stop on disbursement',
      'Repayment schedule generation',
      'Loan status tracking',
      'Write-off via adjustments workflow',
    ],
    roles: ['Approver', 'Super Admin'],
    routes: ['/loans', '/loans/new', '/loans/[id]', '/approver/pending'],
    api: ['GET/POST /loans', 'POST /loans/:id/approve', 'POST /loans/:id/disburse'],
  },
  {
    id: 'loan-pools',
    name: 'Loan Pool Capital',
    purpose: 'Capital replenishment, allocation tracking, and utilisation monitoring.',
    capabilities: [
      'Pool creation and replenishment',
      'Disbursement allocation ledger entries',
      'Available capital calculation',
      'Utilisation percentage display',
      'Hard-stop when insufficient capital',
      'Pool-level transaction history',
    ],
    roles: ['Super Admin'],
    routes: ['/loan-pools'],
    api: ['GET/POST /loan-pools', 'POST /loan-pools/:id/replenish', 'GET /loan-pools/:id/transactions'],
  },
  {
    id: 'payments',
    name: 'Collections & Payments',
    purpose: 'Weekly field collections with GPS, admin fees, and immutability rules.',
    capabilities: [
      'Full weekly payment recording (no partial payments)',
      'Oldest obligation first allocation',
      'GPS metadata on field capture',
      'Same-day edit window for collectors',
      'Immutability after day-end boundary',
      'Admin fee recording',
      'Payment reversal under controlled paths',
    ],
    roles: ['Collector', 'Super Admin'],
    routes: ['/collector/payment/[id]', '/collector/admin-fee', '/reports/daily-collection'],
    api: ['POST /payments', 'POST /payments/:id/reverse', 'GET /payments'],
  },
  {
    id: 'reconciliation',
    name: 'Daily Reconciliation',
    purpose: 'Match collector-recorded cash against physical counts and system totals.',
    capabilities: [
      'End-of-day reconciliation submission',
      'Variance flagging with configurable thresholds',
      'HQ review queue',
      'Overpayment review workflow',
      'Resubmission for rejected/reopened rows',
      'History preservation on resubmit',
    ],
    roles: ['Collector', 'Super Admin', 'Approver'],
    routes: ['/collector/reconciliation'],
    api: ['POST /reconciliation', 'GET /reconciliation', 'PATCH /reconciliation/:id/review'],
  },
  {
    id: 'expenses',
    name: 'Expense Management',
    purpose: 'Field and HQ expense tracking with maker-checker approval.',
    capabilities: [
      'Expense submission with category and receipt',
      'Maker-checker review (submitter cannot approve own)',
      'Operating cash impact (not loan principal)',
      'In-app notifications on submit/review',
      'Expense summary reports',
    ],
    roles: ['Collector', 'Super Admin'],
    routes: ['/expenses', '/collector/expenses'],
    api: ['POST /expenses', 'PATCH /expenses/:id/review', 'GET /expenses'],
  },
  {
    id: 'groups',
    name: 'Group Management',
    purpose: 'Community borrowing group formation and collector assignment.',
    capabilities: [
      'Group creation with size bounds (5–15 default)',
      'Member assignment',
      'Collector assignment',
      'Group risk reporting',
      'Group dissolve workflow (enterprise)',
    ],
    roles: ['Super Admin'],
    routes: ['/groups', '/groups/[id]'],
    api: ['GET/POST /groups', 'PATCH /groups/:id', 'POST /groups/:id/members'],
  },
  {
    id: 'collectors',
    name: 'Collector Management',
    purpose: 'Field agent profiles, assignments, and performance tracking.',
    capabilities: [
      'Collector directory',
      'Assignment to groups and borrowers',
      'Performance metrics in reports',
      'Field shell access control',
    ],
    roles: ['Super Admin'],
    routes: ['/collectors', '/collectors/[id]'],
    api: ['GET /collectors', 'GET /collectors/:id', 'PATCH /collectors/:id'],
  },
  {
    id: 'reports',
    name: 'Reporting',
    purpose: 'Operational and financial reports with contextual export actions.',
    capabilities: [
      'Loan portfolio report',
      'Daily collection report',
      'Defaulter report',
      'Collector performance report',
      'Group risk report',
      'Financial ledger report',
      'Aging analysis and write-offs (v1.6.2+)',
      'Contextual PDF, Excel, CSV, Print exports (v1.7.3 primary pattern)',
      '422 fail-closed on oversized unpaginated lists',
    ],
    roles: ['Super Admin', 'Auditor'],
    routes: ['/reports', '/reports/*', '/auditor/reports'],
    api: ['GET /reports/*', 'POST /exports/jobs'],
  },
  {
    id: 'intelligence',
    name: 'Executive Intelligence',
    purpose: 'Board-grade KPIs, forecasting, and compliance packs.',
    capabilities: [
      'Financial KPI cards',
      'Operational KPI cards',
      'Risk indicator summary',
      'Schedule-based forecasting',
      'Portfolio breakdown by district/community/group',
      'Compliance pack generation',
      'Contextual export buttons',
    ],
    roles: ['Super Admin'],
    routes: ['/executive'],
    api: ['GET /intelligence/*', 'GET /analytics/*'],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    purpose: 'Multi-channel alerts with deduplication and quiet hours.',
    capabilities: [
      'In-app notification inbox',
      'Email transactional delivery',
      'SMS field alerts (provider-configured)',
      'Deduplication window',
      'Quiet hours respect',
      'Daily cron dispatch 06:00 UTC',
    ],
    roles: ['All roles (filtered by relevance)'],
    routes: ['Notification drawer (global)'],
    api: ['GET /notifications', 'PATCH /notifications/:id/read', 'POST /api/cron/notifications'],
  },
  {
    id: 'communications',
    name: 'Communications Center',
    purpose: 'Programme-wide messaging, templates, and broadcasts.',
    capabilities: [
      'Message templates with variables',
      'Role-targeted broadcasts',
      'Audience segments (borrowers, groups, auditors, custom)',
      'Delivery analytics',
      'Read receipts for in-app messages',
    ],
    roles: ['Super Admin'],
    routes: ['/communication-center'],
    api: ['GET/POST /communications/*'],
  },
  {
    id: 'ops',
    name: 'Operations Control',
    purpose: 'System health, incidents, maintenance windows, and runtime metrics.',
    capabilities: [
      'Health metrics dashboard',
      'Ops incident tracking',
      'Maintenance window scheduling',
      'Financial alert monitoring',
      'Deployment version display',
    ],
    roles: ['Super Admin'],
    routes: ['/ops'],
    api: ['GET /ops/*', 'GET /health'],
  },
  {
    id: 'audit',
    name: 'Audit Log',
    purpose: 'Append-only immutable action log for compliance.',
    capabilities: [
      'Actor, action, entity, timestamp recording',
      'Role-scoped read access',
      'Report and export integration',
      'No delete or modify operations',
    ],
    roles: ['Super Admin', 'Auditor'],
    routes: ['/reports/audit-log', '/auditor/audit-log'],
    api: ['GET /audit', 'GET /reports/audit-log'],
  },
  {
    id: 'settings',
    name: 'System Settings',
    purpose: 'Organisation config, users, roles, permissions, and integrations.',
    capabilities: [
      'User CRUD with role assignment',
      'Permission overrides',
      'Force-logout',
      'Login history',
      'Organisation holidays',
      'Security policy configuration',
    ],
    roles: ['Super Admin'],
    routes: ['/settings'],
    api: ['GET/PATCH /settings/*', 'GET/POST /users/*'],
  },
  {
    id: 'sync',
    name: 'Offline Sync',
    purpose: 'Collector offline queue replay on reconnect.',
    capabilities: [
      'localStorage-persisted queue',
      'FIFO drain on reconnect',
      'GPS metadata preservation',
      'Conflict resolution (server wins)',
      'Sync failure user notification',
    ],
    roles: ['Collector'],
    routes: ['Collector field shell'],
    api: ['POST /sync/replay'],
  },
  {
    id: 'adjustments',
    name: 'Ledger Adjustments',
    purpose: 'Supervised capital corrections with maker-checker controls.',
    capabilities: [
      'Adjustment submission',
      'Review and approve/reject workflow',
      'Audited actor tracking',
      'Pool ledger ADJUSTMENT entries',
    ],
    roles: ['Super Admin'],
    routes: ['/adjustments'],
    api: ['POST /adjustments', 'PATCH /adjustments/:id/review'],
  },
  {
    id: 'risk-flags',
    name: 'Risk Flags',
    purpose: 'Borrower, group, and loan risk signal management.',
    capabilities: [
      'Automatic and manual flag creation',
      'Review queue for approvers',
      'Integration with reports and intelligence',
    ],
    roles: ['Super Admin', 'Approver', 'Auditor'],
    routes: ['/risk-flags'],
    api: ['GET/POST /risk-flags', 'PATCH /risk-flags/:id'],
  },
];

const VERSIONS = [
  { v: '1.0.0', period: '2026 Q1', focus: 'Initial platform foundation', items: ['Next.js scaffolding', 'Basic auth', 'Borrower registration', 'Initial RBAC'] },
  { v: '1.1.0', period: '2026 Q1', focus: 'Core lending workflows', items: ['Loan application flow', 'Approval queue', 'Basic collections'] },
  { v: '1.2.0', period: '2026 Q1–Q2', focus: 'Field operations', items: ['Collector portal', 'GPS capture', 'Daily reconciliation'] },
  { v: '1.3.0', period: '2026 Q2', focus: 'Financial integrity', items: ['Pool ledger', 'Admin fee gate', 'Payment immutability', 'Integer pesewas'] },
  { v: '1.3.5', period: '2026 Q2', focus: 'Enterprise hardening', items: ['Audit log', 'Expense workflow', 'Report foundation'] },
  { v: '1.3.7', period: '2026 Q2', focus: 'Financial certification prep', items: ['Reversal engine', 'Dashboard SQL aggregates', 'Integrity audits'] },
  { v: '1.3.8', period: '2026 Q2', focus: 'Enterprise financial', items: ['Pool accounting certification', 'SoD audit', 'Expense engine verification'] },
  { v: '1.4.0', period: '2026 Q2', focus: 'Production readiness', items: ['Final financial integrity audit', 'Report truncation refusal', 'Multi-phase certification'] },
  { v: '1.4.1', period: '2026 Q2', focus: 'Stabilization', items: ['Financial model documentation', 'Residual SoD tracking', 'Production cutover validation'] },
  { v: '1.5.0', period: '2026 Q2–Q3', focus: 'Platform consolidation', items: ['@wilms/domain extraction', 'Route Handlers migration', 'Vercel Cron', 'In-process API default'] },
  { v: '1.5.1', period: '2026 Q3', focus: 'Financial workflow fixes', items: ['Reconciliation edge cases', 'Pool reconcile runtime', 'Migration 0025'] },
  { v: '1.6.0', period: '2026 Q3', focus: 'Communication center', items: ['Audience segments', 'Broadcasts', 'Read receipts', 'Notification automation'] },
  { v: '1.6.1', period: '2026 Q3', focus: 'Product excellence UI', items: ['Design system tokens', 'Command palette', 'Sticky navbar', 'Activity timeline', 'Export standard'] },
  { v: '1.6.2', period: '2026 Q3', focus: 'Enterprise readiness', items: ['Write-off reports', 'Aging analysis', 'Force logout', 'Org holidays', 'Migration 0034'] },
  { v: '1.7.0', period: '2026 Q3', focus: 'Enterprise finance & intelligence', items: ['Executive intelligence', 'Forecasting', 'Export jobs API', 'Ops incidents', 'Migration 0035'] },
  { v: '1.7.1', period: '2026 Q3', focus: 'Market readiness', items: ['Dashboard vs executive separation', 'Recent Activity feed', 'Modal hardening', 'Branded PDF covers'] },
  { v: '1.7.2', period: '2026 Q3', focus: 'RC stabilization', items: ['Financial-grade dashboard', 'Export Center actions', 'Product Tour 2.0', 'Nav polish'] },
  { v: '1.7.3', period: '2026 Q3', focus: 'Documentation suite', items: ['Official documentation library', 'PDF/DOCX generation', 'Export Center UI removal', 'Contextual exports', 'In-app documentation portal', 'Financial Engine book'] },
];

const GLOSSARY = [
  ['Admin fee', 'One-time fee collected before loan disbursement; gate enforced by system'],
  ['Adjustment', 'Audited capital correction posted to pool ledger as ADJUSTMENT type'],
  ['Allocation', 'Pool ledger entry linking capital movement to a loan or repayment'],
  ['Append-only audit', 'Audit log design where entries are never deleted or modified'],
  ['Approver', 'Role authorised to approve or reject loan and borrower applications'],
  ['Auditor', 'Read-only role for reports, audit log, and exports'],
  ['Available capital', 'Pool capital minus outstanding disbursed amounts not yet repaid'],
  ['BFF', 'Backend-for-frontend; Next.js Route Handlers proxying to domain API'],
  ['Borrower', 'Loan recipient registered through KYC workflow'],
  ['Capital replenishment', 'Injection of funds into a loan pool via REPLENISHMENT allocation'],
  ['Cash-first model', 'Programme design assuming physical cash collections in the field'],
  ['Collection delta', 'Difference between physical cash count and system-recorded collections'],
  ['Collector', 'Field agent recording weekly payments and daily reconciliation'],
  ['Compliance pack', 'Executive intelligence export bundle for board and donor review'],
  ['Contextual export', 'Export action embedded in the page displaying source data (v1.7.3 pattern)'],
  ['CSRF', 'Cross-site request forgery protection on mutating BFF paths'],
  ['Daily reconciliation', 'End-of-day matching of collector cash against system totals'],
  ['Day-end boundary', 'Time after which payment records become immutable'],
  ['Defaulted loan', 'Loan with missed repayments exceeding programme threshold'],
  ['Disbursement', 'Release of loan principal from pool to borrower; DISBURSEMENT allocation'],
  ['Domain package', '@wilms/domain — services, Drizzle ORM, Express HTTP app'],
  ['Deduplication', 'Notification system preventing duplicate alerts within a time window'],
  ['Drizzle ORM', 'Type-safe SQL query layer used against Neon PostgreSQL'],
  ['Dual-run mode', 'Development configuration proxying API to standalone Node on port 4000'],
  ['Executive intelligence', 'Board-grade KPI dashboard at /executive'],
  ['Expense', 'Operating cost submission affecting operating cash, not loan principal'],
  ['Export job', 'Tracked async export generation record; API retained post v1.7.3'],
  ['Fail-closed', 'System refusing operation when safety threshold exceeded (e.g. report 422)'],
  ['Field shell', 'Mobile-optimised collector UI profile'],
  ['Force-logout', 'Super Admin capability to terminate active user sessions'],
  ['Forecast', 'Schedule-based projection of expected collections over configurable horizon'],
  ['Full weekly payment', 'Business rule requiring complete weekly instalment; no partial payments'],
  ['GPS capture', 'Geographic coordinates recorded with field transactions'],
  ['Group', 'Community borrowing unit with assigned collector and size bounds'],
  ['Hard-stop', 'System refusal when business rule violated (e.g. insufficient pool capital)'],
  ['HMAC session', 'Custom signed session cookie using WILMS_SESSION_SECRET'],
  ['Immutable payment', 'Payment record that cannot be edited after day-end boundary'],
  ['In-process API', 'Default deployment running domain Express inside Next.js Route Handlers'],
  ['Instalment', 'Scheduled weekly repayment amount on active loan'],
  ['Integer pesewas', 'Money stored as whole pesewas; 100 pesewas = 1 GHS'],
  ['KYC', 'Know Your Customer — borrower identity verification during registration'],
  ['Loan pool', 'Capital fund from which loans are disbursed and to which repayments return'],
  ['Maker-checker', 'Dual-control requiring different users for submit and approve actions'],
  ['Migration journal', 'Numbered SQL files in packages/domain/drizzle applied sequentially'],
  ['Neon PostgreSQL', 'Serverless PostgreSQL database provider for production'],
  ['Net operating cash', 'Collections plus admin fees minus approved expenses'],
  ['Notification inbox', 'In-app message centre with read/unread state'],
  ['Office shell', 'Desktop-optimised admin UI profile for HQ roles'],
  ['Oldest obligation first', 'Payment allocation rule applying funds to earliest due instalment'],
  ['Operating cash', 'Programme cash from collections and fees minus expenses'],
  ['Ops incident', 'Operational incident record tracked in ops module'],
  ['Organisation holiday', 'Configured non-collection day affecting schedules'],
  ['Outstanding', 'Unpaid loan principal: disbursed minus collected'],
  ['Overpayment review', 'Workflow for resolving collection amounts exceeding expected due'],
  ['Payment reversal', 'Controlled unwind of payment allocation and ledger state'],
  ['Pending registration', 'Borrower record awaiting approver review'],
  ['Permission override', 'Individual permission grant/revoke beyond role defaults'],
  ['Pesewas', 'Smallest currency unit; 100 pesewas = 1 Ghana Cedi (GHS)'],
  ['Pool ledger', 'Append-only allocation journal for pool capital movements'],
  ['Pool utilisation', 'Percentage of pool capital currently disbursed and outstanding'],
  ['Primary variance', 'Physical cash minus expected due in reconciliation'],
  ['Product Tour', 'Guided onboarding overlay for new users (v1.7.2 Product Tour 2.0)'],
  ['Quiet hours', 'Organisation setting suppressing non-critical notifications'],
  ['RBAC', 'Role-based access control with five production roles'],
  ['Registration Officer', 'HQ role capturing new borrower registrations'],
  ['Replenishment', 'Capital injection event increasing pool funds'],
  ['Repayment', 'Borrower payment reducing outstanding; REPAYMENT allocation'],
  ['Report truncation', 'Refusal (HTTP 422) when unpaginated report exceeds safe size'],
  ['Reversal allocation', 'Negative ledger entry unwinding a prior REPAYMENT'],
  ['Risk flag', 'Indicator on borrower, group, or loan requiring review'],
  ['Route Handler', 'Next.js API route at /api/wilms forwarding to domain'],
  ['Same-day edit window', 'Period during which collectors may correct same-day payments'],
  ['Schedule', 'Generated repayment plan with weekly instalment dates and amounts'],
  ['Separation of duties', 'SoD — distinct roles for conflicting financial operations'],
  ['Session cookie', 'wilms_session HMAC-signed token in browser cookie jar'],
  ['Soft-fail', 'Graceful degradation when optional tables (e.g. migration 0035) missing'],
  ['Super Admin', 'Full programme administrator role'],
  ['Sync queue', 'Offline collector operation queue replayed on reconnect'],
  ['Transaction', 'Pool ledger entry of type REPLENISHMENT, DISBURSEMENT, REPAYMENT, or ADJUSTMENT'],
  ['Utilisation percent', 'MIN(ROUND(disbursed / capital × 100), 100) per pool'],
  ['Variance threshold', 'Configurable percentage triggering reconciliation flag (default 10%)'],
  ['Vercel Cron', 'Scheduled job runner for daily notification dispatch'],
  ['Write-off', 'Loan balance removal via adjustments maker-checker workflow'],
  ['Zustand', 'Client state library for auth, offline queue, theme, shell layout'],
  ['422 fail-closed', 'HTTP 422 returned when report query exceeds unpaginated safety limit'],
  ['Interest-free', 'Product model with no interest accrual engine'],
  ['Statutory GL', 'Double-entry general ledger — explicitly not implemented; deferred v2.0'],
  ['Multi-tenancy', 'Multiple organisations in one deployment — deferred v2.0'],
  ['PWA', 'Progressive Web App capabilities for field collector access'],
  ['Compliance footer', 'Confidentiality notice appended to all export artefacts'],
  ['Demo mode', 'Development UI path disabled in production via environment guard'],
  ['Login OTP', 'Optional one-time password challenge on login'],
  ['Bcrypt', 'Password hashing algorithm used for credential storage'],
  ['Helmet', 'HTTP security headers middleware in production domain app'],
  ['CSP', 'Content Security Policy configured with Vercel feedback allowlist'],
  ['Rate limiting', 'API throttling; Redis-backed when REDIS_URL configured'],
  ['ExcelJS', 'Spreadsheet export engine for report downloads'],
  ['jsPDF', 'PDF generation library for exports and documentation suite'],
  ['Turborepo', 'Monorepo build orchestration tool'],
  ['Vitest', 'Unit and integration test runner'],
  ['Playwright', 'End-to-end browser test framework'],
];

const ENV_VARS = [
  ['DATABASE_URL', 'Yes (prod)', 'Neon PostgreSQL pooled connection string', 'Secret'],
  ['WILMS_SESSION_SECRET', 'Yes (prod)', 'HMAC key for session token signing', 'Secret; 32+ chars'],
  ['NEXT_PUBLIC_API_BASE_URL', 'Yes', 'Browser API prefix', '/api/wilms'],
  ['NEXT_PUBLIC_USE_MOCK', 'Yes (live)', 'Disable mock service layer', 'false'],
  ['NEXT_PUBLIC_APP_URL', 'Recommended', 'Public site URL for links', 'https://wilms.vercel.app'],
  ['NEXT_PUBLIC_WILMS_ENV', 'Optional', 'Environment label', 'production / development'],
  ['NEXT_PUBLIC_APP_LOCK_IDLE_MS', 'Optional', 'App lock idle timeout ms', '300000'],
  ['WILMS_API_MODE', 'Optional', 'Set proxy for dual-run', 'proxy'],
  ['WILMS_API_UPSTREAM', 'If proxy', 'Upstream Node API URL', 'http://127.0.0.1:4000'],
  ['REDIS_URL', 'Prod serverless', 'Shared rate-limit store', 'Secret'],
  ['WILMS_REDIS_URL', 'Alt to REDIS_URL', 'Redis connection', 'Secret'],
  ['WILMS_SCHEDULER_TOKEN', 'Cron/API', 'Bearer for scheduler routes', 'Secret'],
  ['CRON_SECRET', 'Recommended', 'Vercel Cron bearer for notifications', 'Secret'],
  ['WILMS_METRICS_TOKEN', 'Optional', 'Prometheus scrape bearer', 'Secret'],
  ['WILMS_CORS_ORIGIN', 'Standalone Node', 'CORS allowlist', '—'],
  ['WILMS_APP_URL', 'Optional', 'Canonical app URL', '—'],
  ['WILMS_API_PORT', 'Optional', 'Node adapter listen port', '4000'],
  ['WILMS_TRUST_PROXY', 'Optional', 'Express trust proxy', '—'],
  ['WILMS_MIN_GROUP_SIZE', 'Optional', 'Minimum group members', '5'],
  ['WILMS_MAX_GROUP_SIZE', 'Optional', 'Maximum group members', '15'],
  ['UPLOAD_PROVIDER', 'Prod typical', 'local or cloudinary', 'cloudinary'],
  ['CLOUDINARY_CLOUD_NAME', 'If Cloudinary', 'Cloud name', 'Secret'],
  ['CLOUDINARY_API_KEY', 'If Cloudinary', 'API key', 'Secret'],
  ['CLOUDINARY_API_SECRET', 'If Cloudinary', 'API secret', 'Secret'],
  ['MAIL_PROVIDER', 'Optional', 'none, gmail, resend, etc.', '—'],
  ['MAIL_FROM', 'Optional', 'From email address', '—'],
  ['SMS_PROVIDER', 'Optional', 'none, smsnotifygh, etc.', '—'],
  ['SMSNOTIFYGH_API_KEY', 'If SMSNotifyGH', 'SMS API key', 'Secret'],
  ['NEXT_PUBLIC_DEMO_MODE', 'Dev only', 'Force demo UI', 'unset in prod'],
  ['WILMS_RUNTIME', 'Optional', 'serverless disables workers', 'auto on Vercel'],
  ['VERCEL_GIT_COMMIT_SHA', 'Injected', 'Commit SHA in health', '—'],
];

const ROADMAP = [
  { version: 'v1.8', theme: 'Integrations and payments', effort: '8–12 weeks', items: ['MTN MoMo integration', 'Vodafone Cash integration', 'Bank statement import', 'Webhook infrastructure', 'OpenAPI spec generation'] },
  { version: 'v1.9', theme: 'Enterprise automation', effort: '6–10 weeks', items: ['Workflow rules engine', 'Scheduled report delivery', 'Advanced notification routing', 'Bulk import/export tooling'] },
  { version: 'v2.0', theme: 'General ledger and multi-branch', effort: '16–24 weeks', items: ['Statutory double-entry GL', 'Multi-organisation tenancy', 'Branch-level pool isolation', 'Inter-branch transfers'] },
  { version: 'v2.5', theme: 'Borrower engagement', effort: '8–12 weeks', items: ['Borrower SMS notifications', 'Payment reminder automation', 'Optional read-only borrower portal'] },
  { version: 'v3.0', theme: 'Platform scale', effort: '20–30 weeks', items: ['Multi-region deployment', 'ML risk scoring', 'Localized UI (Twi, Ga, Ewe)', 'Partner API marketplace'] },
];

const DEFERRED = [
  ['Borrower self-service portal', 'Deferred', 'HQ-operated programme model; borrowers interact through field staff'],
  ['Multi-organisation tenancy', 'Deferred v2.0', 'Current partners deploy single-org; isolation complexity not yet required'],
  ['Statutory double-entry GL', 'Deferred v2.0', 'Operational pool ledger meets programme audit needs today'],
  ['Native mobile app', 'Deferred', 'PWA and responsive field shell adequate for current field operations'],
  ['Deep payment provider integrations', 'Deferred v1.8', 'Cash-first model; MoMo/bank APIs planned next release line'],
  ['Full shadcn migration', 'Partial', 'High-traffic routes migrated; remainder scheduled post-RC'],
  ['WCAG full audit pass', 'In progress', 'Remediations ongoing per QA units'],
  ['Localized user guides', 'Deferred v2.x', 'English manuals first; Twi/Ga/Ewe translation planned'],
  ['Redis + BullMQ job queue', 'Deferred', 'Vercel Cron and in-process sufficient at current scale'],
  ['Standalone Export Center', 'Removed v1.7.3', 'Contextual exports reduce duplicate navigation; API retained'],
];

function moduleChapter(mod, index) {
  const lines = [];
  lines.push(`### Chapter ${index + 1}.${mod.id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} — ${mod.name}`);
  lines.push('');
  lines.push(`**Module ID:** \`${mod.id}\``);
  lines.push('');
  lines.push('#### Purpose');
  lines.push('');
  lines.push(mod.purpose);
  lines.push('');
  lines.push('#### Authorised roles');
  lines.push('');
  for (const r of mod.roles) lines.push(`- ${r}`);
  lines.push('');
  lines.push('#### Core capabilities');
  lines.push('');
  for (const c of mod.capabilities) lines.push(`- ${c}`);
  lines.push('');
  lines.push('#### Primary routes');
  lines.push('');
  for (const r of mod.routes) lines.push(`- \`${r}\``);
  lines.push('');
  lines.push('#### API surface (representative)');
  lines.push('');
  for (const a of mod.api) lines.push(`- \`${a}\``);
  lines.push('');
  lines.push('#### Operational notes');
  lines.push('');
  lines.push(`The ${mod.name} module integrates with the domain service layer in \`packages/domain/src/services/\`. All mutations pass through RBAC permission checks and are recorded in the append-only audit log where applicable. Financial modules enforce integer pesewas arithmetic and maker-checker rules as documented in the Financial Engine Book.`);
  lines.push('');
  lines.push('#### Data integrity controls');
  lines.push('');
  lines.push('- Permission middleware on every mutating endpoint');
  lines.push('- Input validation via shared validation schemas');
  lines.push('- Audit log entry on state-changing operations');
  lines.push('- Fail-closed behaviour on safety threshold violations');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart LR');
  lines.push(`    UI[${mod.name} UI] --> API[Domain API]`);
  lines.push('    API --> RBAC[Permission Check]');
  lines.push('    RBAC --> SVC[Service Layer]');
  lines.push('    SVC --> DB[(Neon PostgreSQL)]');
  lines.push('    SVC --> AUDIT[Audit Log]');
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

function versionSection(ver) {
  const lines = [];
  lines.push(`### ${ver.v} (${ver.period})`);
  lines.push('');
  lines.push(`**Focus:** ${ver.focus}`);
  lines.push('');
  lines.push('**Deliverables:**');
  lines.push('');
  for (const item of ver.items) lines.push(`- ${item}`);
  lines.push('');
  lines.push('**Platform impact:**');
  lines.push('');
  if (ver.v.startsWith('1.7')) {
    lines.push('- Documentation and packaging emphasis; financial formulas unchanged in v1.7.3');
  } else if (parseFloat(ver.v) >= 1.5) {
    lines.push('- Domain package architecture; Route Handlers; Vercel deployment patterns');
  } else if (parseFloat(ver.v) >= 1.3) {
    lines.push('- Financial integrity controls; pool ledger; certification evidence');
  } else {
    lines.push('- Foundation modules; RBAC; core lending lifecycle');
  }
  lines.push('');
  return lines.join('\n');
}

function buildFinancialEngineBook() {
  const sections = [];
  sections.push('# WILMS Financial Engine Book');
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push('## Cover metadata');
  sections.push('');
  sections.push('| Field | Value |');
  sections.push('|-------|-------|');
  sections.push('| **Title** | WILMS Financial Engine Book |');
  sections.push('| **Edition** | Official Documentation Library |');
  sections.push('| **Platform version documented** | Through v1.7.2 |');
  sections.push('| **Documentation release** | v1.7.3 |');
  sections.push('| **Date** | August 2026 |');
  sections.push('| **Classification** | Confidential |');
  sections.push('| **Money unit** | Integer pesewas (100 = 1 GHS) |');
  sections.push('');
  sections.push('## Table of contents');
  sections.push('');
  sections.push('1. [Executive summary](#executive-summary)');
  sections.push('2. [Product financial model](#product-financial-model)');
  sections.push('3. [Money representation](#money-representation)');
  sections.push('4. [Pool accounting](#pool-accounting)');
  sections.push('5. [Operating cash](#operating-cash)');
  sections.push('6. [Disbursement engine](#disbursement-engine)');
  sections.push('7. [Repayment and collections](#repayment-and-collections)');
  sections.push('8. [Outstanding balances](#outstanding-balances)');
  sections.push('9. [Admin fees](#admin-fees)');
  sections.push('10. [Write-offs and aging](#write-offs-and-aging)');
  sections.push('11. [Reversals](#reversals)');
  sections.push('12. [Reconciliation](#reconciliation)');
  sections.push('13. [Expenses and operating ledger](#expenses-and-operating-ledger)');
  sections.push('14. [Adjustments](#adjustments)');
  sections.push('15. [Reporting and aggregates](#reporting-and-aggregates)');
  sections.push('16. [Integrity controls](#integrity-controls)');
  sections.push('17. [Explicit non-claims](#explicit-non-claims)');
  sections.push('18. [Appendices](#appendices)');
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push('## Executive summary');
  sections.push('');
  sections.push("WILMS manages women's interest-free group lending programmes. The financial engine is an **operational** system of record — pool ledgers, payment journals, and expense ledgers — not a statutory double-entry general ledger. All monetary values are stored as **integer pesewas** to eliminate floating-point errors.");
  sections.push('');
  sections.push('The core money chain flows from registration and approval through admin fee confirmation, pool-gated disbursement, weekly collections with GPS verification, daily reconciliation, and reporting. Expenses affect operating cash only; they never reduce loan principal balances.');
  sections.push('');
  sections.push('## Product financial model');
  sections.push('');
  sections.push('WILMS programmes operate on a **cash-first, interest-free** model:');
  sections.push('');
  sections.push('- No interest accrual engine exists or is planned for v1.x');
  sections.push('- Loans draw from named capital pools with hard-stop disbursement');
  sections.push('- Weekly instalments are collected in full (no partial payments)');
  sections.push('- Admin fees are collected before disbursement is permitted');
  sections.push('- Field collectors record payments with GPS metadata');
  sections.push('- HQ reconciles physical cash daily against system records');
  sections.push('');
  sections.push('```mermaid');
  sections.push('flowchart TB');
  sections.push('    REG[Registration & Approval] --> FEE[Admin Fee Confirmed]');
  sections.push('    FEE --> POOL{Pool Sufficient?}');
  sections.push('    POOL -->|Yes| DISB[Disbursement]');
  sections.push('    POOL -->|No| STOP[Hard Stop]');
  sections.push('    DISB --> COLL[Weekly Collections]');
  sections.push('    COLL --> RECON[Daily Reconciliation]');
  sections.push('    COLL --> OUT[Outstanding Reduction]');
  sections.push('    EXP[Expenses] --> OCASH[Operating Cash]');
  sections.push('    COLL --> OCASH');
  sections.push('```');
  sections.push('');
  sections.push('## Money representation');
  sections.push('');
  sections.push('### Integer pesewas');
  sections.push('');
  sections.push('All database columns storing money use integer pesewas. One Ghana Cedi (GHS) equals 100 pesewas. UI components format pesewas for display using shared currency utilities. Server-side arithmetic never uses floating-point for money.');
  sections.push('');
  sections.push('| Display | Storage |');
  sections.push('|---------|---------|');
  sections.push('| GHS 10.50 | 1050 pesewas |');
  sections.push('| GHS 500.00 | 50000 pesewas |');
  sections.push('| GHS 0.01 | 1 pesewa |');
  sections.push('');
  sections.push('### Rounding rules');
  sections.push('');
  sections.push('- Utilisation percent: `MIN(ROUND(disbursed / capital × 100), 100)`');
  sections.push('- Repayment rate: `ROUND(collected / disbursed × 100, 1)` when disbursed > 0');
  sections.push('- Variance thresholds compared in pesewas with 100 pesewa (1 GHS) floor');
  sections.push('');
  sections.push('## Pool accounting');
  sections.push('');
  sections.push('Each loan pool maintains an append-only `pool_allocations` ledger.');
  sections.push('');
  sections.push('| Event | Allocation type | Effect |');
  sections.push('|-------|-----------------|--------|');
  sections.push('| Pool created / capital injected | REPLENISHMENT | Increases pool capital |');
  sections.push('| Loan disbursed from pool | DISBURSEMENT | Increases disbursed; reduces available |');
  sections.push('| Borrower repayment | REPAYMENT | Increases collected; reduces outstanding |');
  sections.push('| Manual correction | ADJUSTMENT | Audited capital correction |');
  sections.push('');
  sections.push('### Per-pool formulas');
  sections.push('');
  sections.push('```');
  sections.push('disbursed_pesewas     = SUM(DISBURSEMENT allocations)');
  sections.push('collected_pesewas     = SUM(REPAYMENT allocations)');
  sections.push('outstanding_pesewas   = MAX(disbursed − collected, 0)');
  sections.push('available_capital     = capital_pesewas − outstanding_pesewas');
  sections.push('utilisation_percent   = MIN(ROUND(disbursed / capital × 100), 100)');
  sections.push('repayment_rate_percent = ROUND(collected / disbursed × 100, 1)  [when disbursed > 0]');
  sections.push('```');
  sections.push('');
  sections.push('Pool list and dashboard merge loan portfolio totals when allocation aggregates lag (runtime reconcile + migration 0025).');
  sections.push('');
  sections.push('## Operating cash');
  sections.push('');
  sections.push('Operating cash represents programme liquidity from collections and fees minus approved expenses:');
  sections.push('');
  sections.push('```');
  sections.push('net_operating_cash = collections + admin_fees_collected − approved_expenses');
  sections.push('net_collections_after_expenses = MAX(total_collected − approved_expenses, 0)');
  sections.push('```');
  sections.push('');
  sections.push('Expenses are deducted from operating cash, **not** from loan principal or outstanding balances.');
  sections.push('');
  sections.push('## Disbursement engine');
  sections.push('');
  sections.push('Disbursement requires:');
  sections.push('');
  sections.push('1. Approved loan in PENDING_DISBURSEMENT status');
  sections.push('2. Admin fee confirmed and recorded');
  sections.push('3. Sufficient available pool capital (hard-stop if not)');
  sections.push('4. Actor with disbursement permission');
  sections.push('');
  sections.push('On success, a DISBURSEMENT allocation is written to the pool ledger and the loan transitions to ACTIVE with a generated repayment schedule.');
  sections.push('');
  sections.push('```mermaid');
  sections.push('sequenceDiagram');
  sections.push('    participant A as Approver/Admin');
  sections.push('    participant S as Domain Service');
  sections.push('    participant P as Pool Ledger');
  sections.push('    participant L as Loan Record');
  sections.push('    A->>S: Request disbursement');
  sections.push('    S->>S: Verify admin fee');
  sections.push('    S->>P: Check available capital');
  sections.push('    alt Insufficient capital');
  sections.push('        S-->>A: Hard stop error');
  sections.push('    else Sufficient');
  sections.push('        S->>P: Write DISBURSEMENT');
  sections.push('        S->>L: Activate loan + schedule');
  sections.push('        S-->>A: Success');
  sections.push('    end');
  sections.push('```');
  sections.push('');
  sections.push('## Repayment and collections');
  sections.push('');
  sections.push('### Business rules');
  sections.push('');
  sections.push('- **Full weekly payment only** — partial payments are rejected');
  sections.push('- **Oldest obligation first** — payment applied to earliest due instalment');
  sections.push('- **GPS required** on field capture');
  sections.push('- **Same-day edit window** for collectors to correct entries');
  sections.push('- **Immutability after day-end** — no edits once day boundary passes');
  sections.push('');
  sections.push('### Collection allocation');
  sections.push('');
  sections.push('When a payment is recorded:');
  sections.push('');
  sections.push('1. Validate full weekly amount matches schedule expectation');
  sections.push('2. Write REPAYMENT allocation to pool ledger');
  sections.push('3. Update loan outstanding balance');
  sections.push('4. Record GPS metadata and collector ID');
  sections.push('5. Emit audit log entry and notifications as configured');
  sections.push('');
  sections.push('## Outstanding balances');
  sections.push('');
  sections.push('Outstanding at loan level: remaining principal from schedule minus confirmed payments.');
  sections.push('');
  sections.push('Organisation dashboard outstanding:');
  sections.push('');
  sections.push('```');
  sections.push('outstanding = MAX(pool outstanding sum, active/defaulted loan balances)');
  sections.push('```');
  sections.push('');
  sections.push('## Admin fees');
  sections.push('');
  sections.push('Admin fees are one-time charges collected before disbursement. The system blocks disbursement until the admin fee is confirmed. Admin fees contribute to net operating cash but are separate from loan principal.');
  sections.push('');
  sections.push('## Write-offs and aging');
  sections.push('');
  sections.push('Write-offs (v1.6.2+) proceed through the adjustments maker-checker workflow. Aging analysis reports identify loans by days past due. Write-offs do not bypass audit controls — they require supervisory review.');
  sections.push('');
  sections.push('## Reversals');
  sections.push('');
  sections.push('Payment reversals unwind allocation and payment state under controlled paths:');
  sections.push('');
  sections.push('- Negative REPAYMENT allocation posted to pool ledger');
  sections.push('- REVERSAL ledger entry for audit trail');
  sections.push('- Payment status updated to reversed');
  sections.push('- Permission-gated; logged in audit log');
  sections.push('');
  sections.push('## Reconciliation');
  sections.push('');
  sections.push('```');
  sections.push('primary_variance = physical_cash − expected_due');
  sections.push('collection_delta = physical_cash − system_recorded');
  sections.push('```');
  sections.push('');
  sections.push('Variance is **flagged** when:');
  sections.push('');
  sections.push('- collection_delta ≠ 0');
  sections.push('- expected_due = 0 and physical cash ≠ 0');
  sections.push('- absolute primary variance ≥ 100 pesewas (1 GHS)');
  sections.push('- percentage variance exceeds threshold (default 10%)');
  sections.push('');
  sections.push('Review requires Super Admin access. Collectors bound to own collectorId. REJECTED/REOPENED rows may be resubmitted with history preserved.');
  sections.push('');
  sections.push('## Expenses and operating ledger');
  sections.push('');
  sections.push('Expenses follow maker-checker: submitter cannot approve own expense. Approved expenses post as operating ledger ADJUSTMENT entries. They reduce net operating cash but never affect loan principal.');
  sections.push('');
  sections.push('## Adjustments');
  sections.push('');
  sections.push('Capital adjustments require supervisory review via /adjustments. Approved adjustments write ADJUSTMENT type pool ledger entries. Residual SoD gaps (self-approve on adjustments) documented as Medium risk in certification packs.');
  sections.push('');
  sections.push('## Reporting and aggregates');
  sections.push('');
  sections.push('Organisation dashboard metrics (buildDashboardFinancialOverview):');
  sections.push('');
  sections.push('| Metric | Calculation |');
  sections.push('|--------|-------------|');
  sections.push('| Pool funds | SUM(pool.capital_pesewas) |');
  sections.push('| Total disbursed | MAX(pool disbursed, loan portfolio disbursed) |');
  sections.push('| Total collected | SUM(confirmed payments) |');
  sections.push('| Outstanding | MAX(pool outstanding, active loan balances) |');
  sections.push('| Available capital | pool funds − outstanding |');
  sections.push('');
  sections.push('Oversized unpaginated report queries return HTTP 422 (fail-closed).');
  sections.push('');
  sections.push('## Integrity controls');
  sections.push('');
  sections.push('| Control | Status |');
  sections.push('|---------|--------|');
  sections.push('| Admin fee before disbursement | Verified |');
  sections.push('| Pool hard-stop | Verified |');
  sections.push('| Payment immutability after day-end | Verified |');
  sections.push('| GPS on field capture | Verified |');
  sections.push('| Reversal unwind | Verified |');
  sections.push('| SQL dashboard KPIs | Verified |');
  sections.push('| Report truncation refusal | Verified |');
  sections.push('| Adjustment self-approve | Residual Medium |');
  sections.push('| Expense self-post APPROVED | Residual Medium |');
  sections.push('');
  sections.push('## Explicit non-claims');
  sections.push('');
  sections.push('- WILMS is **not** a statutory double-entry general ledger');
  sections.push('- No interest accrual engine (interest-free product)');
  sections.push('- Expenses do not affect loan principal balances');
  sections.push('- No Production Certified financial seal for all residual items');
  sections.push('');
  sections.push('## Appendices');
  sections.push('');
  sections.push('### Appendix A — Data integrity workflow');
  sections.push('');
  sections.push('```');
  sections.push('Pool created → Capital (REPLENISHMENT)');
  sections.push('            → Loan PENDING_APPROVAL (admin fee required)');
  sections.push('            → Approve → PENDING_DISBURSEMENT');
  sections.push('            → Disbursement (DISBURSEMENT; capital hard stop)');
  sections.push('            → Collection (REPAYMENT; GPS required)');
  sections.push('            → Reversal (negative REPAYMENT + REVERSAL)');
  sections.push('            → Expense (operating cash; never principal)');
  sections.push('            → Dashboard / Reports / Exports');
  sections.push('```');
  sections.push('');
  sections.push('### Appendix B — Related documentation');
  sections.push('');
  sections.push('- `docs/FINANCIAL_MODEL.md` — architecture hub financial summary');
  sections.push('- `docs/financial-calculations.md` — formula reference');
  sections.push('- `documentation/books/WILMS_PRODUCT_BOOK.md` — product context');
  sections.push('- `documentation/books/REPORTING_ANALYTICS_BOOK.md` — report specifications');
  sections.push('');
  sections.push(FOOTER);
  sections.push('*WILMS Financial Engine Book — Documentation release v1.7.3 — Platform documented through v1.7.2*');
  return sections.join('\n');
}

function buildExpandedProductBook(baseContent) {
  const extra = [];
  extra.push('');
  extra.push('---');
  extra.push('');
  extra.push('## Part II — Domain deep-dives');
  extra.push('');
  extra.push('This section provides entity-level reference for architects, auditors, and implementation teams.');
  extra.push('');

  const entities = [
    { name: 'User', desc: 'System account with role enum, status, permission overrides, login history, and force-logout capability.', fields: ['id', 'email', 'role', 'status', 'permissionOverrides', 'lastLoginAt'] },
    { name: 'Borrower', desc: 'Loan recipient with personal details, documents, GPS coordinates, group membership, and registration status.', fields: ['id', 'firstName', 'lastName', 'phone', 'groupId', 'status', 'gpsLat', 'gpsLng'] },
    { name: 'Group', desc: 'Community borrowing unit with size bounds, assigned collector, and member list.', fields: ['id', 'name', 'collectorId', 'memberCount', 'district', 'community'] },
    { name: 'Loan', desc: 'Application through servicing with schedule, status machine, and pool association.', fields: ['id', 'borrowerId', 'poolId', 'principalPesewas', 'status', 'schedule', 'adminFeePaid'] },
    { name: 'LoanPool', desc: 'Capital pool with replenishment history, allocation ledger, and utilisation metrics.', fields: ['id', 'name', 'capitalPesewas', 'disbursedPesewas', 'collectedPesewas'] },
    { name: 'Payment', desc: 'Collection or admin fee with GPS metadata, collector ID, and immutability timestamp.', fields: ['id', 'loanId', 'amountPesewas', 'type', 'gpsLat', 'gpsLng', 'collectorId', 'recordedAt'] },
    { name: 'Transaction', desc: 'Pool ledger allocation entry.', fields: ['id', 'poolId', 'type', 'amountPesewas', 'loanId', 'actorId', 'createdAt'] },
    { name: 'Reconciliation', desc: 'Daily collector cash reconciliation with variance flags and review status.', fields: ['id', 'collectorId', 'physicalCashPesewas', 'expectedDuePesewas', 'status', 'variancePesewas'] },
    { name: 'Expense', desc: 'Field or HQ expense with submit/review workflow.', fields: ['id', 'submitterId', 'amountPesewas', 'category', 'status', 'reviewerId'] },
    { name: 'AuditEntry', desc: 'Immutable action log record.', fields: ['id', 'actorId', 'action', 'entityType', 'entityId', 'metadata', 'createdAt'] },
    { name: 'Notification', desc: 'In-app notification with read state and channel metadata.', fields: ['id', 'userId', 'type', 'read', 'payload', 'createdAt'] },
    { name: 'ExportJob', desc: 'Tracked export generation job (API retained; standalone UI removed v1.7.3).', fields: ['id', 'type', 'status', 'requestedBy', 'artifactUrl', 'expiresAt'] },
    { name: 'OpsIncident', desc: 'Operational incident record for platform monitoring.', fields: ['id', 'severity', 'title', 'status', 'resolvedAt'] },
    { name: 'RiskFlag', desc: 'Risk indicator on borrower, group, or loan.', fields: ['id', 'entityType', 'entityId', 'reason', 'status', 'reviewedBy'] },
  ];

  for (const e of entities) {
    extra.push(`### Entity: ${e.name}`);
    extra.push('');
    extra.push(e.desc);
    extra.push('');
    extra.push('**Key attributes:**');
    extra.push('');
    for (const f of e.fields) extra.push(`- \`${f}\``);
    extra.push('');
    extra.push(`Full schema: \`packages/domain/src/db/schema/\``);
    extra.push('');
  }

  extra.push('---');
  extra.push('');
  extra.push('## Part III — Module reference');
  extra.push('');
  extra.push('Detailed reference for every major platform module through v1.7.2.');
  extra.push('');

  MODULES.forEach((mod, i) => extra.push(moduleChapter(mod, i)));

  extra.push('---');
  extra.push('');
  extra.push('## Part IV — Extended version history');
  extra.push('');
  extra.push('Comprehensive release lineage from v1.0.0 through v1.7.3.');
  extra.push('');

  for (const ver of VERSIONS) extra.push(versionSection(ver));

  extra.push('---');
  extra.push('');
  extra.push('## Part V — RBAC matrix narrative');
  extra.push('');
  extra.push('WILMS implements role-based access control with five production roles. Super Admin receives all permissions. Other roles receive curated subsets enforcing separation of duties.');
  extra.push('');
  extra.push('### Permission catalogue');
  extra.push('');
  extra.push('| Permission ID | Description |');
  extra.push('|---------------|-------------|');
  const perms = [
    ['access-admin-portal', 'Enter Super Admin portal routes'],
    ['access-collector-portal', 'Enter collector field shell'],
    ['access-registration-portal', 'Enter registration officer portal'],
    ['access-approver-portal', 'Enter approver portal'],
    ['access-auditor-portal', 'Enter auditor read-only portal'],
    ['register-borrowers', 'Create new borrower records'],
    ['edit-borrowers', 'Modify borrower profiles'],
    ['edit-pending-registrations', 'Edit pending registration submissions'],
    ['capture-documents', 'Upload borrower documents'],
    ['upload-signatures', 'Capture borrower signatures'],
    ['gps-verification', 'Record GPS coordinates'],
    ['manage-groups', 'Create and modify borrowing groups'],
    ['view-assigned-borrowers', 'View borrowers assigned to collector'],
    ['record-collections', 'Record payment collections'],
    ['record-expenses', 'Submit field expenses'],
    ['view-reports', 'Access operational reports'],
    ['view-financial-reports', 'Access financial reports and executive intelligence'],
    ['export-reports', 'Generate report exports'],
    ['view-audit-log', 'Read audit log entries'],
    ['review-applications', 'Review pending applications'],
    ['approve-borrowers', 'Approve borrower registrations'],
    ['approve-loans', 'Approve loan applications'],
    ['reject-loans', 'Reject loan applications'],
    ['review-risk-flags', 'Review and resolve risk flags'],
    ['manage-users', 'Create and manage user accounts'],
    ['manage-system-settings', 'Configure organisation settings'],
    ['manage-expenses', 'Review and approve expenses'],
    ['view-all-collectors', 'View collector directory'],
    ['force-logout', 'Terminate active user sessions'],
    ['manage-communications', 'Access communication center'],
    ['view-communication-analytics', 'View communication delivery analytics'],
    ['send-broadcast', 'Send programme-wide broadcasts'],
  ];
  for (const [id, desc] of perms) extra.push(`| \`${id}\` | ${desc} |`);
  extra.push('');
  extra.push('### Role-permission summary');
  extra.push('');
  extra.push('| Permission | Super Admin | Officer | Collector | Approver | Auditor |');
  extra.push('|------------|:-----------:|:-------:|:---------:|:--------:|:-------:|');
  extra.push('| Portal access (role-specific) | Admin | Registration | Collector | Approver | Auditor |');
  extra.push('| Register borrowers | ✓ | ✓ | ✓ | | |');
  extra.push('| Approve loans | ✓ | | | ✓ | |');
  extra.push('| Record collections | ✓ | | ✓ | | |');
  extra.push('| View reports | ✓ | | | | ✓ |');
  extra.push('| Export reports | ✓ | | | | ✓ |');
  extra.push('| View audit log | ✓ | | | | ✓ |');
  extra.push('| Manage users | ✓ | | | | |');
  extra.push('| Manage communications | ✓ | | | | |');
  extra.push('');
  extra.push('Canonical source: `packages/shared-rbac/src/role-permissions.ts`');
  extra.push('');
  extra.push('### Separation of duties matrix');
  extra.push('');
  extra.push('| Operation | Submitter role | Approver role | Enforcement |');
  extra.push('|-----------|----------------|---------------|-------------|');
  extra.push('| Loan approval | Registration Officer | Approver | Policy + RBAC |');
  extra.push('| Expense posting | Collector/Admin | Different user | Maker-checker API |');
  extra.push('| Disbursement | — | Super Admin/Approver | Admin fee + pool gate |');
  extra.push('| Pool adjustment | Admin | Reviewer | Adjustments workflow |');
  extra.push('| Audit log delete | — | — | Not permitted |');
  extra.push('');

  extra.push('---');
  extra.push('');
  extra.push('## Part VI — Roadmap v1.8–v3.0 (detailed)');
  extra.push('');
  for (const r of ROADMAP) {
    extra.push(`### ${r.version} — ${r.theme}`);
    extra.push('');
    extra.push(`**Estimated effort:** ${r.effort}`);
    extra.push('');
    extra.push('**Planned deliverables:**');
    extra.push('');
    for (const item of r.items) extra.push(`- ${item}`);
    extra.push('');
    extra.push('**Dependencies:** Prior release certification; partner requirements gathering; infrastructure scaling assessment.');
    extra.push('');
  }

  extra.push('---');
  extra.push('');
  extra.push('## Part VII — Skipped and deferred (detailed rationale)');
  extra.push('');
  extra.push('| Item | Status | Rationale |');
  extra.push('|------|--------|-----------|');
  for (const [item, status, why] of DEFERRED) extra.push(`| ${item} | ${status} | ${why} |`);
  extra.push('');

  extra.push('---');
  extra.push('');
  extra.push('## Part VIII — Appendices (expanded)');
  extra.push('');
  extra.push('### Appendix A — Glossary (80+ terms)');
  extra.push('');
  extra.push('| Term | Definition |');
  extra.push('|------|------------|');
  for (const [term, def] of GLOSSARY) extra.push(`| ${term} | ${def} |`);
  extra.push('');

  extra.push('### Appendix B — Environment variables catalogue');
  extra.push('');
  extra.push('| Variable | Required | Purpose | Notes |');
  extra.push('|----------|----------|---------|-------|');
  for (const [name, req, purpose, notes] of ENV_VARS) extra.push(`| \`${name}\` | ${req} | ${purpose} | ${notes} |`);
  extra.push('');
  extra.push('Full reference: `docs/environment.md`');
  extra.push('');

  extra.push('### Appendix C — Migration journal (placeholders)');
  extra.push('');
  extra.push('| Migration | Description |');
  extra.push('|-----------|-------------|');
  for (let i = 1; i <= 35; i++) {
    const num = String(i).padStart(4, '0');
    let desc = 'Schema evolution';
    if (i === 25) desc = 'Pool reconcile runtime support';
    if (i === 34) desc = 'Enterprise readiness workflows';
    if (i === 35) desc = 'Finance reporting intelligence (jobs, alerts, incidents)';
    extra.push(`| ${num} | ${desc} |`);
  }
  extra.push('');
  extra.push('Verify integrity: `npm run verify:migrations -w @wilms/domain`');
  extra.push('');

  extra.push('### Appendix D — Compliance and data protection');
  extra.push('');
  extra.push('- Audit log retained indefinitely (no automated purge)');
  extra.push('- Export artefacts include confidentiality footer');
  extra.push('- Demo accounts disabled in production via environment guard');
  extra.push('- Password policy enforced via shared validation schemas');
  extra.push('- Upload file types restricted to MIME allowlist');
  extra.push('- Programme operates under partner data processing agreements');
  extra.push('- GDPR-aligned data subject requests handled per partner policy');
  extra.push('- Session tokens signed with HMAC; rotation requires planned maintenance');
  extra.push('- Force-logout available for personnel offboarding');
  extra.push('- Financial reports fail-closed rather than truncate silently');
  extra.push('');

  extra.push('### Appendix E — Financial Engine Book cross-reference');
  extra.push('');
  extra.push('For pool accounting, disbursement, repayment, reconciliation, reversals, and ledger behaviour, see `documentation/books/FINANCIAL_ENGINE_BOOK.md`.');
  extra.push('');

  extra.push('### Appendix F — In-app documentation portal');
  extra.push('');
  extra.push('Release v1.7.3 adds a Super Admin documentation portal at `/documentation` linking to this library. Source markdown lives in repository `documentation/`; PDF and DOCX artefacts generated via `npm run docs:generate`.');
  extra.push('');

  // Part IX — Extended workflow narratives (print-ready depth)
  extra.push('---');
  extra.push('');
  extra.push('## Part IX — Extended workflow narratives');
  extra.push('');
  extra.push('Step-by-step operational procedures for programme staff training and audit reference.');
  extra.push('');

  const workflows = [
    {
      name: 'Borrower registration (end-to-end)',
      steps: [
        'Registration Officer logs into registration portal',
        'Navigate to Register Borrower and complete KYC fields',
        'Capture required documents per programme checklist',
        'Record borrower signature digitally',
        'Capture GPS coordinates at registration location',
        'Submit registration to pending queue',
        'Approver receives notification of pending registration',
        'Approver reviews documents side-by-side',
        'On approval: assign group and collector',
        'Borrower status transitions to approved; ready for loan application',
      ],
    },
    {
      name: 'Loan approval and disbursement',
      steps: [
        'Loan application created for approved borrower',
        'Approver opens pending application queue',
        'Review loan amount, term, and borrower history',
        'Check risk flags if present',
        'Approve or reject with documented reason',
        'On approval: confirm admin fee collection',
        'System validates pool available capital',
        'If insufficient: hard-stop with error message',
        'If sufficient: execute disbursement',
        'Pool DISBURSEMENT allocation written',
        'Loan schedule generated; status ACTIVE',
      ],
    },
    {
      name: 'Weekly field collection',
      steps: [
        'Collector opens field shell dashboard',
        'Select assigned group or borrower',
        'Verify weekly instalment amount due',
        'Record full payment (partial payments rejected)',
        'Capture GPS at collection location',
        'If offline: queue operation in local storage',
        'If online: immediate sync to domain API',
        'REPAYMENT allocation updates pool ledger',
        'Payment immutable after organisation day-end',
        'Same-day corrections allowed within edit window',
      ],
    },
    {
      name: 'Daily reconciliation',
      steps: [
        'Collector completes day collections',
        'Open reconciliation form in field shell',
        'Enter physical cash count',
        'System compares against expected due and recorded',
        'Submit reconciliation record',
        'Variance rules evaluate primary and collection delta',
        'If flagged: enters HQ review queue',
        'Super Admin or designated reviewer resolves variance',
        'Overpayment review if physical exceeds expected',
        'Approved reconciliation closes daily cycle',
      ],
    },
    {
      name: 'Expense submit and review',
      steps: [
        'Collector or Admin submits expense with category',
        'Attach receipt if required by policy',
        'Expense enters pending review status',
        'Different user (not submitter) reviews expense',
        'Approve: posts to operating cash ledger',
        'Reject: returns with reason to submitter',
        'In-app notification sent on status change',
        'Approved expenses appear in expense summary reports',
        'Operating cash reduced; loan principal unaffected',
      ],
    },
    {
      name: 'Contextual export (v1.7.3)',
      steps: [
        'User navigates to report, borrower profile, or executive view',
        'Select export format: PDF, Excel, CSV, or Print',
        'Export job created via API if async generation required',
        'Confidentiality footer appended to artefact',
        'Download or share from contextual action menu',
        'Standalone Export Center route no longer used',
        'Bookmarks to /exports redirect to /reports',
      ],
    },
  ];

  for (const wf of workflows) {
    extra.push(`### Workflow: ${wf.name}`);
    extra.push('');
    for (let i = 0; i < wf.steps.length; i++) {
      extra.push(`${i + 1}. ${wf.steps[i]}`);
    }
    extra.push('');
    extra.push('**Controls applied:** RBAC permission check, audit log entry, integer pesewas validation.');
    extra.push('');
  }

  // Part X — Report catalogue
  extra.push('---');
  extra.push('');
  extra.push('## Part X — Report catalogue');
  extra.push('');
  const reports = [
    ['Loan Portfolio', '/reports/loan-portfolio', 'Outstanding balances, disbursements, portfolio composition'],
    ['Daily Collection', '/reports/daily-collection', 'Daily totals, variances, collector performance'],
    ['Defaulters', '/reports/defaulters', 'Missed repayments and default risk'],
    ['Collector Performance', '/reports/collector-performance', 'Expected vs actual by collector'],
    ['Group Risk', '/reports/group-risk', 'Group-level risk distribution'],
    ['Financial Ledger', '/reports/financial-ledger', 'Ledger movements for audit'],
    ['Audit Log', '/reports/audit-log', 'Immutable action history'],
    ['Aging Analysis', '/reports/aging-analysis', 'Days past due breakdown (v1.6.2+)'],
    ['Write-offs', '/reports/write-offs', 'Write-off register (v1.6.2+)'],
  ];
  extra.push('| Report | Route | Purpose |');
  extra.push('|--------|-------|---------|');
  for (const [name, route, purpose] of reports) {
    extra.push(`| ${name} | \`${route}\` | ${purpose} |`);
  }
  extra.push('');
  extra.push('All reports support contextual export actions. Oversized unpaginated queries return HTTP 422.');
  extra.push('');

  // Part XI — Deployment and operations reference
  extra.push('---');
  extra.push('');
  extra.push('## Part XI — Deployment and operations reference');
  extra.push('');
  extra.push('### Production checklist');
  extra.push('');
  extra.push('1. Configure DATABASE_URL (Neon pooled endpoint)');
  extra.push('2. Set WILMS_SESSION_SECRET (32+ character secret)');
  extra.push('3. Set NEXT_PUBLIC_API_BASE_URL=/api/wilms');
  extra.push('4. Set NEXT_PUBLIC_USE_MOCK=false');
  extra.push('5. Configure REDIS_URL for serverless rate limiting');
  extra.push('6. Set CRON_SECRET and WILMS_SCHEDULER_TOKEN for scheduled jobs');
  extra.push('7. Configure upload provider (Cloudinary recommended)');
  extra.push('8. Run database migrations before first deploy');
  extra.push('9. Verify smoke tests pass in staging');
  extra.push('10. Disable demo mode environment variables in production');
  extra.push('');
  extra.push('### Health and monitoring');
  extra.push('');
  extra.push('- `/api/wilms/health` — application health endpoint');
  extra.push('- Ops dashboard at `/ops` — incidents, maintenance, version');
  extra.push('- Audit log — compliance investigations');
  extra.push('- Financial alerts — configured thresholds in intelligence module');
  extra.push('');

  // Part XII — Testing reference
  extra.push('---');
  extra.push('');
  extra.push('## Part XII — Testing and verification reference');
  extra.push('');
  extra.push('| Command | Purpose |');
  extra.push('|---------|---------|');
  extra.push('| `npm run lint` | ESLint across frontend |');
  extra.push('| `npm run test` | Vitest unit and integration |');
  extra.push('| `npm run test -w @wilms/domain` | Domain service tests |');
  extra.push('| `npm run type-check` | TypeScript strict check |');
  extra.push('| `npm run verify:version` | Version consistency |');
  extra.push('| `npm run verify:migrations` | Migration journal integrity |');
  extra.push('| `npm run smoke:rbac` | RBAC permission smoke |');
  extra.push('| `npm run smoke:notifications` | Notification dispatch smoke |');
  extra.push('| `npm run docs:generate` | PDF/DOCX documentation suite |');
  extra.push('');

  // Part XIII — Programme FAQ and certification reference
  extra.push('---');
  extra.push('');
  extra.push('## Part XIII — Programme FAQ and certification reference');
  extra.push('');
  const faqs = [
    ['What money unit does WILMS use?', 'Integer pesewas. 100 pesewas = 1 GHS. No floating-point money arithmetic.'],
    ['Is WILMS a general ledger?', 'No. Operational pool ledgers and payment journals only. Statutory GL deferred v2.0.'],
    ['Does WILMS charge interest?', 'No. Interest-free product model. No interest accrual engine.'],
    ['Can collectors record partial payments?', 'No. Full weekly instalment required. Business rule enforced at API level.'],
    ['When do payments become immutable?', 'After organisation day-end boundary. Same-day edit window applies before that.'],
    ['What auth system does WILMS use?', 'Custom HMAC-signed session cookies (wilms_session). Not Auth.js or JWT browser sessions.'],
    ['Where did Export Center go in v1.7.3?', 'Standalone /exports removed. Use contextual exports on reports, profiles, and executive views.'],
    ['Is the export job API still available?', 'Yes. POST/GET /exports/jobs retained for embedded and programmatic flows.'],
    ['How many production roles exist?', 'Five: Super Admin, Registration Officer, Collector, Approver, Auditor.'],
    ['Can a collector approve their own expense?', 'No. Maker-checker requires a different user for approval.'],
    ['What happens when pool capital is insufficient?', 'Hard-stop. Disbursement refused until replenishment increases available capital.'],
    ['Are admin fees required before disbursement?', 'Yes. System blocks disbursement until admin fee confirmed.'],
    ['Do expenses reduce loan principal?', 'No. Expenses affect operating cash only.'],
    ['How does offline collection work?', 'Collector offline queue in localStorage; FIFO replay on reconnect via sync module.'],
    ['What database does WILMS use?', 'Neon PostgreSQL with Drizzle ORM.'],
    ['Where does the API run in production?', 'In-process via Next.js Route Handlers at /api/wilms by default.'],
    ['How are notifications dispatched on schedule?', 'Vercel Cron daily at 06:00 UTC via /api/cron/notifications.'],
    ['Can audit log entries be deleted?', 'No. Append-only design. No user can delete audit entries.'],
    ['What report size limit applies?', 'Oversized unpaginated report queries return HTTP 422 (fail-closed).'],
    ['Where is the Financial Engine documented?', 'documentation/books/FINANCIAL_ENGINE_BOOK.md'],
    ['How do I generate PDF manuals?', 'npm run docs:generate from repository root.'],
    ['Where is the in-app documentation portal?', '/documentation — Super Admin, ACCESS_ADMIN_PORTAL permission.'],
    ['What is contextual export?', 'Export action on the page displaying the source data (v1.7.3 primary pattern).'],
    ['Can Super Admin override permissions?', 'Yes. Individual permission overrides are audited.'],
    ['What GPS data is captured?', 'Latitude and longitude on field collections and registration verification.'],
    ['How is reconciliation variance flagged?', 'Collection delta, primary variance ≥ 1 GHS, percentage threshold (default 10%).'],
    ['What write-off workflow applies?', 'Adjustments maker-checker via /adjustments (v1.6.2+).'],
    ['Is multi-organisation supported?', 'Not in v1.x. Deferred to v2.0.'],
    ['Is there a borrower portal?', 'Not in scope. HQ-operated model. Optional read-only portal planned v2.5.'],
    ['What test commands should CI run?', 'lint, test, type-check, verify:version, verify:migrations, smoke:rbac.'],
  ];
  for (const [q, a] of faqs) {
    extra.push(`**Q: ${q}**`);
    extra.push('');
    extra.push(`A: ${a}`);
    extra.push('');
  }
  extra.push('### Certification pack references');
  extra.push('');
  extra.push('| Pack | Location | Scope |');
  extra.push('|------|----------|-------|');
  extra.push('| v1.3.8 enterprise financial | docs/certification/v1.3.8/enterprise-financial/ | Pool accounting, SoD, reversals |');
  extra.push('| v1.4 final system audit | docs/certification/v1.4/final-system-audit/ | Financial integrity closure |');
  extra.push('| v1.7.2 RC1 | docs/v1.7.2/ | Release candidate stabilization evidence |');
  extra.push('| v1.7.3 docs suite | docs/v1.7.3/ | Documentation release pack |');
  extra.push('');

  // Insert expansion before final footer in base content
  const footerMarker = '*WILMS Product Book — Documentation release v1.7.3';
  const idx = baseContent.indexOf(footerMarker);
  if (idx === -1) {
    return baseContent + extra.join('\n') + FOOTER + '\n*WILMS Product Book — Documentation release v1.7.3 — Platform documented through v1.7.2*\n';
  }
  const beforeFooter = baseContent.slice(0, idx);
  return beforeFooter + extra.join('\n') + '\n' + baseContent.slice(idx);
}

function getBaseContent(content) {
  const partII = content.indexOf('\n## Part II —');
  if (partII !== -1) return content.slice(0, partII);
  return content;
}

function main() {
  const productPath = path.join(booksDir, 'WILMS_PRODUCT_BOOK.md');
  const financialPath = path.join(booksDir, 'FINANCIAL_ENGINE_BOOK.md');

  const rawContent = fs.readFileSync(productPath, 'utf8');
  const baseContent = getBaseContent(rawContent);
  const expanded = buildExpandedProductBook(baseContent);
  fs.writeFileSync(productPath, expanded, 'utf8');

  const financial = buildFinancialEngineBook();
  fs.writeFileSync(financialPath, financial, 'utf8');

  const productLines = expanded.split('\n').length;
  const financialLines = financial.split('\n').length;
  const productBytes = fs.statSync(productPath).size;
  const financialBytes = fs.statSync(financialPath).size;

  console.log('Expanded WILMS_PRODUCT_BOOK.md:', productLines, 'lines,', productBytes, 'bytes');
  console.log('Created FINANCIAL_ENGINE_BOOK.md:', financialLines, 'lines,', financialBytes, 'bytes');
}

main();
