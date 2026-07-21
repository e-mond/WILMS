/**
 * Operations status for Super Admin operations dashboard.
 * Aggregates health + financial snapshot + worker topology. No secrets.
 */
import { buildHealthReport } from '../health/health.service.js';
import { buildDashboardFinancialOverview } from '../dashboard/financial-overview.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { getFeatureFlags } from '../../config/feature-flags.js';
import { getQueueStats } from '../../infrastructure/queue/index.js';
import { env } from '../../config/env.js';
import { getNotificationMetrics } from '../../infrastructure/notifications/notification-metrics.js';

export type OpsSurfaceState = 'ok' | 'degraded' | 'unavailable' | 'external' | 'not_applicable';

export interface OpsSurface {
  id: string;
  label: string;
  state: OpsSurfaceState;
  detail: string;
}

export interface OpsStatusReport {
  generatedAt: string;
  deployment: {
    version: string;
    gitCommit: string | null;
    environment: string;
    nodeVersion: string;
    buildId: string | null;
    deployedAt: string | null;
  };
  health: Awaited<ReturnType<typeof buildHealthReport>>;
  surfaces: OpsSurface[];
  workers: {
    redis: 'not_used' | 'configured' | 'connected' | 'unavailable';
    queue: 'in_process' | 'bullmq' | 'disabled';
    scheduler: 'http_triggered';
    note: string;
    stats?: {
      waiting: number;
      active: number;
      failed: number;
      completed: number;
    };
  };
  featureFlags: ReturnType<typeof getFeatureFlags>;

  financial: {
    availableCapitalPesewas: number;
    totalDisbursedPesewas: number;
    totalCollectedPesewas: number;
    outstandingPesewas: number;
    totalExpensesPesewas: number;
    netOperatingCashPesewas: number;
    collectionRatePercent: number;
    alerts: string[];
  } | null;
  databaseEnabled: boolean;
  backups: {
    status: 'external_managed';
    provider: 'neon';
    detail: string;
  };
}

function surface(
  id: string,
  label: string,
  state: OpsSurfaceState,
  detail: string,
): OpsSurface {
  return { id, label, state, detail };
}

function buildSurfaces(
  health: Awaited<ReturnType<typeof buildHealthReport>>,
  financial: OpsStatusReport['financial'],
): OpsSurface[] {
  const dbState: OpsSurfaceState = !health.database.configured
    ? 'not_applicable'
    : health.database.connected
      ? health.migrations.status === 'ok' && health.schema.status === 'ok'
        ? 'ok'
        : 'degraded'
      : 'unavailable';

  const mailState: OpsSurfaceState = health.integrations.mail.configured ? 'ok' : 'degraded';
  const smsState: OpsSurfaceState = health.integrations.sms.configured ? 'ok' : 'degraded';
  const storageState: OpsSurfaceState = health.uploads.valid
    ? 'ok'
    : health.environment === 'production'
      ? 'unavailable'
      : 'degraded';

  const financialState: OpsSurfaceState = !financial
    ? health.database.configured
      ? 'unavailable'
      : 'not_applicable'
    : financial.alerts.includes('negative_operating_cash')
      ? 'degraded'
      : 'ok';

  return [
    surface(
      'system',
      'System Health',
      health.status === 'ok' ? 'ok' : 'degraded',
      health.degradedReasons.length > 0
        ? health.degradedReasons.join('; ')
        : 'All health probes passed',
    ),
    surface(
      'database',
      'Database',
      dbState,
      `${health.database.status}; migrations=${health.migrations.status}; schema=${health.schema.status}`,
    ),
    surface(
      'queue_workers',
      'Queue Workers',
      'ok',
      'In-process handlers (Redis/BullMQ not deployed in v1.3.8)',
    ),
    surface(
      'storage',
      'Storage',
      storageState,
      `${health.uploads.activeProvider}; valid=${health.uploads.valid}`,
    ),
    surface('redis', 'Redis', 'not_applicable', 'Not used in v1.3.8 (planned v1.4 durable queues)'),
    surface(
      'email',
      'Email',
      mailState,
      `${health.integrations.mail.provider}; configured=${health.integrations.mail.configured}`,
    ),
    surface(
      'sms',
      'SMS',
      smsState,
      `${health.integrations.sms.provider}; configured=${health.integrations.sms.configured}`,
    ),
    surface(
      'api',
      'API',
      health.status === 'ok' ? 'ok' : 'degraded',
      `wilms-api ${health.version}; uptime=${health.uptimeSeconds}s`,
    ),
    surface(
      'frontend',
      'Frontend',
      'external',
      'Vercel deployment — probe /login and BFF /api/auth/csrf separately',
    ),
    surface(
      'background_jobs',
      'Background Jobs',
      'ok',
      'In-process (notifications, mail dispatch)',
    ),
    surface(
      'scheduled_jobs',
      'Scheduled Jobs',
      'ok',
      'HTTP-triggered scheduler (no persistent cron worker)',
    ),
    surface(
      'financial_engine',
      'Financial Engine',
      financialState,
      financial
        ? `netOperatingCash=${financial.netOperatingCashPesewas}; collectionRate=${financial.collectionRatePercent}%`
        : 'Financial snapshot unavailable',
    ),
    surface(
      'daily_collections',
      'Daily Collections',
      financial ? 'ok' : 'not_applicable',
      financial
        ? `collected=${financial.totalCollectedPesewas} pesewas; outstanding=${financial.outstandingPesewas}`
        : 'Requires database',
    ),
    surface(
      'loan_pools',
      'Loan Pools',
      financial ? 'ok' : 'not_applicable',
      financial
        ? `availableCapital=${financial.availableCapitalPesewas} pesewas`
        : 'Requires database',
    ),
    surface(
      'expenses',
      'Expenses',
      financial ? 'ok' : 'not_applicable',
      financial ? `totalExpenses=${financial.totalExpensesPesewas} pesewas` : 'Requires database',
    ),
    surface(
      'notifications',
      'Notifications',
      'ok',
      `in-app available; email=${health.integrations.notifications.email}; sms=${health.integrations.notifications.sms}`,
    ),
    surface(
      'security_events',
      'Security Events',
      'external',
      'Review Audit Log (/reports/audit-log) and auth failure patterns in logs',
    ),
    surface(
      'deployment_version',
      'Deployment Version',
      'ok',
      `${health.version}${health.gitCommit ? ` @ ${health.gitCommit.slice(0, 7)}` : ''}`,
    ),
    surface(
      'backup_status',
      'Backup Status',
      'external',
      'Neon PITR / managed backups — verify in Neon console (not probed by API)',
    ),
  ];
}

export async function buildOpsStatusReport(): Promise<OpsStatusReport> {
  const health = await buildHealthReport();
  const alerts: string[] = [];

  let financial: OpsStatusReport['financial'] = null;
  if (isDatabaseEnabled()) {
    try {
      const overview = await buildDashboardFinancialOverview();
      const net = overview.cashFlow.netOperatingCashPesewas;
      if (net < 0) {
        alerts.push('negative_operating_cash');
      }
      financial = {
        availableCapitalPesewas: overview.capital.currentAvailableBalancePesewas,
        totalDisbursedPesewas: overview.lending.totalLoanAmountDisbursedPesewas,
        totalCollectedPesewas: overview.collections.totalAmountCollectedPesewas,
        outstandingPesewas: overview.collections.outstandingBalancePesewas,
        totalExpensesPesewas: overview.expenses.totalExpensesPesewas,
        netOperatingCashPesewas: net,
        collectionRatePercent: overview.collections.collectionRatePercent,
        alerts,
      };
    } catch {
      financial = null;
      alerts.push('financial_snapshot_unavailable');
    }
  }

  const resolvedFinancial =
    financial ??
    (alerts.includes('financial_snapshot_unavailable')
      ? {
          availableCapitalPesewas: 0,
          totalDisbursedPesewas: 0,
          totalCollectedPesewas: 0,
          outstandingPesewas: 0,
          totalExpensesPesewas: 0,
          netOperatingCashPesewas: 0,
          collectionRatePercent: 0,
          alerts,
        }
      : null);

  const queueStats = await getQueueStats();
  const flags = getFeatureFlags();
  const redisState = !env.redisUrl
    ? 'not_used'
    : queueStats.redisConnected
      ? 'connected'
      : queueStats.redisConfigured
        ? 'unavailable'
        : 'configured';

  return {
    generatedAt: new Date().toISOString(),
    deployment: {
      version: health.version,
      gitCommit: health.gitCommit,
      environment: health.environment,
      nodeVersion: health.runtime.nodeVersion,
      buildId: health.runtime.buildId,
      deployedAt: health.runtime.deployedAt,
    },
    health,
    surfaces: buildSurfaces(health, resolvedFinancial),
    workers: {
      redis: redisState,
      queue: queueStats.mode,
      scheduler: 'http_triggered',
      note:
        queueStats.mode === 'bullmq'
          ? 'Durable BullMQ workers active (Redis).'
          : env.redisUrl
            ? 'REDIS_URL set but workers running in-process fallback (connection unavailable or flag off).'
            : 'In-process jobs (set REDIS_URL + WILMS_FLAG_DURABLE_QUEUES for BullMQ).',
      stats: {
        waiting: queueStats.waiting,
        active: queueStats.active,
        failed: queueStats.failed,
        completed: queueStats.completed,
      },
    },
    featureFlags: flags,
    financial: resolvedFinancial,
    databaseEnabled: isDatabaseEnabled(),
    backups: {
      status: 'external_managed',
      provider: 'neon',
      detail: 'Point-in-time recovery and snapshots are managed in Neon. Confirm retention and last successful restore test in the operations calendar.',
    },
  };
}

/** Minimal Prometheus text exposition for scrape-based monitoring. */
export function buildPrometheusMetrics(report: OpsStatusReport): string {
  const healthUp = report.health.status === 'ok' ? 1 : 0;
  const dbUp = report.health.database.connected ? 1 : 0;
  const queueMode = report.workers.queue === 'bullmq' ? 1 : 0;
  const lines = [
    '# HELP wilms_health_up 1 when overall health status is ok',
    '# TYPE wilms_health_up gauge',
    `wilms_health_up ${healthUp}`,
    '# HELP wilms_database_up 1 when database is connected',
    '# TYPE wilms_database_up gauge',
    `wilms_database_up ${dbUp}`,
    '# HELP wilms_uptime_seconds Process uptime in seconds',
    '# TYPE wilms_uptime_seconds gauge',
    `wilms_uptime_seconds ${report.health.uptimeSeconds}`,
    '# HELP wilms_mail_configured 1 when mail delivery is configured',
    '# TYPE wilms_mail_configured gauge',
    `wilms_mail_configured ${report.health.integrations.mail.configured ? 1 : 0}`,
    '# HELP wilms_sms_configured 1 when SMS delivery is configured',
    '# TYPE wilms_sms_configured gauge',
    `wilms_sms_configured ${report.health.integrations.sms.configured ? 1 : 0}`,
    '# HELP wilms_queue_bullmq 1 when BullMQ mode is active',
    '# TYPE wilms_queue_bullmq gauge',
    `wilms_queue_bullmq ${queueMode}`,
    '# HELP wilms_queue_waiting Jobs waiting',
    '# TYPE wilms_queue_waiting gauge',
    `wilms_queue_waiting ${report.workers.stats?.waiting ?? 0}`,
    '# HELP wilms_queue_failed Jobs failed',
    '# TYPE wilms_queue_failed gauge',
    `wilms_queue_failed ${report.workers.stats?.failed ?? 0}`,
  ];

  if (report.financial) {
    lines.push(
      '# HELP wilms_net_operating_cash_pesewas Net operating cash (collections+fees-expenses)',
      '# TYPE wilms_net_operating_cash_pesewas gauge',
      `wilms_net_operating_cash_pesewas ${report.financial.netOperatingCashPesewas}`,
      '# HELP wilms_outstanding_pesewas Portfolio outstanding',
      '# TYPE wilms_outstanding_pesewas gauge',
      `wilms_outstanding_pesewas ${report.financial.outstandingPesewas}`,
      '# HELP wilms_negative_operating_cash 1 when net operating cash is negative',
      '# TYPE wilms_negative_operating_cash gauge',
      `wilms_negative_operating_cash ${report.financial.netOperatingCashPesewas < 0 ? 1 : 0}`,
    );
  }

  const notificationMetrics = getNotificationMetrics();
  lines.push(
    '# HELP wilms_notifications_created Total notification delivery records created',
    '# TYPE wilms_notifications_created counter',
    `wilms_notifications_created ${notificationMetrics.created}`,
    '# HELP wilms_notifications_sent Total notifications marked sent',
    '# TYPE wilms_notifications_sent counter',
    `wilms_notifications_sent ${notificationMetrics.sent}`,
    '# HELP wilms_notifications_failed Total notification delivery failures',
    '# TYPE wilms_notifications_failed counter',
    `wilms_notifications_failed ${notificationMetrics.failed}`,
    '# HELP wilms_notifications_duplicate_prevented Duplicate sends prevented by dedupe',
    '# TYPE wilms_notifications_duplicate_prevented counter',
    `wilms_notifications_duplicate_prevented ${notificationMetrics.duplicate_prevented}`,
    '# HELP wilms_notifications_payment_due_soon Payment due-soon events emitted',
    '# TYPE wilms_notifications_payment_due_soon counter',
    `wilms_notifications_payment_due_soon ${notificationMetrics.payment_due_soon}`,
    '# HELP wilms_notifications_payment_missed Payment missed events emitted',
    '# TYPE wilms_notifications_payment_missed counter',
    `wilms_notifications_payment_missed ${notificationMetrics.payment_missed}`,
    '# HELP wilms_notifications_payment_confirmed Payment confirmed events emitted',
    '# TYPE wilms_notifications_payment_confirmed counter',
    `wilms_notifications_payment_confirmed ${notificationMetrics.payment_confirmed}`,
  );

  const safeVersion = report.deployment.version.replace(/"/g, '');
  lines.push(`# HELP wilms_info Deployment metadata`, `# TYPE wilms_info gauge`);
  lines.push(`wilms_info{version="${safeVersion}"} 1`);

  return `${lines.join('\n')}\n`;
}
