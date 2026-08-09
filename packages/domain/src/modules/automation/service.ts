import { uuidv7 } from 'uuidv7';
import { desc, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { automationRuns, automationRules, automationTasks } from '../../db/schema/automation.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';

export const PAYMENT_REMINDER_OFFSETS_DAYS = [-3, -1, 0, 1, 3, 7, 14, 30] as const;
export const OVERDUE_ESCALATION_DAYS = [7, 14, 30, 60, 90] as const;

export const ESCALATION_ROLE_LADDER = [
  'COLLECTOR',
  'REGISTRATION_OFFICER',
  'APPROVER',
  'SUPER_ADMIN',
  'SUPER_ADMIN',
] as const;

export interface AutomationRuleSeed {
  name: string;
  category: string;
  triggerType: string;
  conditions?: Record<string, unknown>;
  actions?: unknown[];
  scheduleCron?: string | null;
}

const DEFAULT_RULES: AutomationRuleSeed[] = [
  {
    name: 'Scheduled payment reminders',
    category: 'FINANCIAL',
    triggerType: 'SCHEDULE',
    scheduleCron: '0 6 * * *',
    conditions: { offsetsDays: [...PAYMENT_REMINDER_OFFSETS_DAYS] },
    actions: [{ type: 'NOTIFY_CHANNELS', channels: ['IN_APP', 'PUSH', 'SMS', 'EMAIL'] }],
  },
  {
    name: 'Overdue loan escalation ladder',
    category: 'FINANCIAL',
    triggerType: 'SCHEDULE',
    scheduleCron: '30 6 * * *',
    conditions: {
      thresholdsDays: [...OVERDUE_ESCALATION_DAYS],
      roles: [...ESCALATION_ROLE_LADDER],
    },
    actions: [{ type: 'ESCALATE_AND_FLAG' }],
  },
  {
    name: 'Collector follow-up tasks',
    category: 'OPERATIONAL',
    triggerType: 'EVENT',
    conditions: {
      events: [
        'MISSED_PAYMENT',
        'RECONCILIATION_PENDING',
        'HOLIDAY_REQUEST_PENDING',
        'EXPENSE_PENDING',
        'BORROWER_FOLLOW_UP',
      ],
    },
    actions: [{ type: 'CREATE_TASK' }],
  },
  {
    name: 'Executive report schedule',
    category: 'EXECUTIVE',
    triggerType: 'SCHEDULE',
    scheduleCron: '0 7 * * 1',
    conditions: { cadences: ['daily', 'weekly', 'monthly', 'quarterly'] },
    actions: [{ type: 'GENERATE_EXECUTIVE_PACK' }],
  },
  {
    name: 'Auto-assignment by workload',
    category: 'OPERATIONAL',
    triggerType: 'EVENT',
    conditions: { factors: ['community', 'district', 'workload', 'portfolio', 'availability'] },
    actions: [{ type: 'ASSIGN_LEAST_LOADED' }],
  },
];

export async function ensureDefaultAutomationRules(): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  const db = getDb();
  const existing = await db.select({ id: automationRules.id }).from(automationRules).limit(1);
  if (existing.length > 0) {
    return 0;
  }

  for (const rule of DEFAULT_RULES) {
    await db.insert(automationRules).values({
      id: uuidv7(),
      name: rule.name,
      category: rule.category,
      triggerType: rule.triggerType,
      enabled: true,
      conditions: rule.conditions ?? {},
      actions: rule.actions ?? [],
      scheduleCron: rule.scheduleCron ?? null,
    });
  }

  return DEFAULT_RULES.length;
}

export async function listAutomationRules() {
  if (!isDatabaseEnabled()) {
    return DEFAULT_RULES.map((rule, index) => ({
      id: `memory-${index}`,
      ...rule,
      enabled: true,
    }));
  }

  await ensureDefaultAutomationRules();
  const db = getDb();
  return db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
}

export async function setAutomationRuleEnabled(id: string, enabled: boolean) {
  if (!isDatabaseEnabled()) {
    return { id, enabled };
  }

  const db = getDb();
  const [row] = await db
    .update(automationRules)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(automationRules.id, id))
    .returning();

  if (!row) {
    throw new Error('NOT_FOUND');
  }
  return row;
}

export async function resolveAssigneeByWorkload(preferredCommunity?: string | null) {
  if (!isDatabaseEnabled()) {
    return null;
  }

  try {
    const { listUsers } = await import('../../repositories/user.repository.js');
    const users = await listUsers();
    const collectors = users.filter(
      (user) => user.role === 'COLLECTOR' && user.status === 'ACTIVE',
    );
    if (collectors.length === 0) {
      return null;
    }

    const db = getDb();
    const openTasks = await db
      .select({
        assigneeUserId: automationTasks.assigneeUserId,
      })
      .from(automationTasks)
      .where(eq(automationTasks.status, 'OPEN'));

    const load = new Map<string, number>();
    for (const collector of collectors) {
      load.set(collector.id, 0);
    }
    for (const task of openTasks) {
      if (task.assigneeUserId && load.has(task.assigneeUserId)) {
        load.set(task.assigneeUserId, (load.get(task.assigneeUserId) ?? 0) + 1);
      }
    }

    const ranked = [...collectors].sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));
    if (preferredCommunity) {
      const needle = preferredCommunity.toLowerCase();
      const communityMatch = ranked.find((collector) => {
        const haystack = `${collector.displayName ?? ''} ${collector.email ?? ''}`.toLowerCase();
        return haystack.includes(needle);
      });
      if (communityMatch) {
        return communityMatch.id;
      }
    }
    return ranked[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function createFollowUpTask(input: {
  title: string;
  category: string;
  assigneeUserId?: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  dueAt?: Date | null;
  payload?: Record<string, unknown>;
  autoAssign?: boolean;
  preferredCommunity?: string | null;
}) {
  const assigneeUserId =
    input.assigneeUserId ??
    (input.autoAssign
      ? await resolveAssigneeByWorkload(input.preferredCommunity)
      : null);

  if (!isDatabaseEnabled()) {
    return { id: uuidv7(), ...input, assigneeUserId, status: 'OPEN' };
  }

  const db = getDb();
  const id = uuidv7();
  await db.insert(automationTasks).values({
    id,
    title: input.title,
    category: input.category,
    status: 'OPEN',
    assigneeUserId,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    dueAt: input.dueAt ?? null,
    payload: input.payload ?? {},
  });

  if (assigneeUserId) {
    await createInAppNotification({
      userId: assigneeUserId,
      event: 'SUPERVISOR_ALERT',
      title: 'Follow-up task assigned',
      body: input.title,
      href: '/collector/dashboard',
    });
  }

  return { id, status: 'OPEN', assigneeUserId };
}

async function notifyExecutivesOfPack(summary: string): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  try {
    const { listUsers } = await import('../../repositories/user.repository.js');
    const users = await listUsers();
    const executives = users.filter(
      (user) =>
        (user.role === 'SUPER_ADMIN' || user.role === 'APPROVER') && user.status === 'ACTIVE',
    );

    await Promise.all(
      executives.map(async (user) => {
        await createInAppNotification({
          userId: user.id,
          event: 'SUPERVISOR_ALERT',
          title: 'Executive automation pack ready',
          body: summary,
          href: '/executive',
        });
      }),
    );

    return executives.length;
  } catch {
    return 0;
  }
}

const INACTIVE_REENGAGE_MESSAGES = [
  'It has been a while since you signed in to WILMS. Open the dashboard to review new collections, holidays, and programme updates.',
  'We noticed you have not been active in WILMS for over a week. Please sign in to check recent alerts and keep the programme current.',
  'Your Super Admin session has been quiet for more than seven days. Log in to WILMS to review pending work and system updates.',
  'A quick reminder from WILMS: it has been over a week since your last login. Sign in when you can to check for updates.',
] as const;

function pickInactiveReengageMessage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % INACTIVE_REENGAGE_MESSAGES.length;
  }
  return INACTIVE_REENGAGE_MESSAGES[hash]!;
}

/** Email + in-app nudge for Super Admins with lastLoginAt older than 7 days (weekly dedupe). */
export async function processInactiveSuperAdminReengagement(now = new Date()): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  try {
    const { listUsers } = await import('../../repositories/user.repository.js');
    const {
      tryAcquireNotificationDelivery,
      markNotificationDeliveryStatus,
    } = await import('../../infrastructure/notifications/notification-dedupe.js');
    const { getMailProvider } = await import('../../infrastructure/mail/index.js');
    const { getSettings } = await import('../settings/service.js');

    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const isoWeek = (() => {
      const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    })();

    const users = await listUsers();
    const inactive = users.filter((user) => {
      if (user.role !== 'SUPER_ADMIN' || user.status !== 'ACTIVE' || !user.email?.trim()) {
        return false;
      }
      const last = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
      if (!last || Number.isNaN(last.getTime())) {
        // Never logged in after invite — skip until first login establishes activity baseline.
        return false;
      }
      return last.getTime() < cutoff.getTime();
    });

    const settings = await getSettings();
    const mail = getMailProvider();
    let sent = 0;

    for (const user of inactive) {
      const dedupeKey = `inactive-sa-reengage:${isoWeek}:${user.id}`;
      const acquired = await tryAcquireNotificationDelivery({
        dedupeKey,
        recipient: user.id,
        channel: 'EMAIL',
        notificationType: 'INACTIVE_SUPER_ADMIN_REENGAGE',
        userId: user.id,
      });
      if (!acquired) {
        continue;
      }

      const body = pickInactiveReengageMessage(`${user.id}:${isoWeek}`);
      await createInAppNotification({
        userId: user.id,
        event: 'LOGIN_ALERT',
        title: 'It has been a while',
        body,
        href: '/dashboard',
        dedupeKey,
      });

      if (settings.emailNotificationsEnabled && mail.isConfigured()) {
        try {
          await mail.send({
            to: user.email,
            subject: 'WILMS — it has been a while',
            text: `Hi ${user.displayName || 'Super Admin'},\n\n${body}\n\nSign in: open WILMS and check for updates.\n\n— WILMS`,
            html: `<p>Hi ${user.displayName || 'Super Admin'},</p><p>${body}</p><p>Sign in to WILMS to check for updates.</p><p>— WILMS</p>`,
          });
        } catch (error) {
          console.error('[automation] inactive re-engage email failed:', error);
        }
      }

      await markNotificationDeliveryStatus({
        dedupeKey,
        recipient: user.id,
        channel: 'EMAIL',
        status: 'SENT',
      });
      sent += 1;
    }

    return sent;
  } catch (error) {
    console.error('[automation] inactive Super Admin re-engagement failed:', error);
    return 0;
  }
}

export async function runDailyAutomationPass(): Promise<{
  rulesEnsured: number;
  remindersEvaluated: number;
  escalationsEvaluated: number;
  followUpsCreated: number;
  executivePackRecipients: number;
  inactiveSuperAdminNudges: number;
  runId: string | null;
}> {
  const rulesEnsured = await ensureDefaultAutomationRules();
  const remindersEvaluated = PAYMENT_REMINDER_OFFSETS_DAYS.length;
  const escalationsEvaluated = OVERDUE_ESCALATION_DAYS.length;
  let followUpsCreated = 0;
  let executivePackRecipients = 0;
  let inactiveSuperAdminNudges = 0;

  const rules = await listAutomationRules();
  const enabled = new Set(
    rules.filter((rule) => rule.enabled !== false).map((rule) => String(rule.name)),
  );

  if (enabled.has('Collector follow-up tasks')) {
    try {
      const pendingHolidays = await (
        await import('../holiday-requests/service.js')
      ).listHolidayRequests({
        actorUserId: 'system',
        scope: 'all',
        statuses: ['SUBMITTED'],
      });
      for (const request of pendingHolidays.slice(0, 20)) {
        await createFollowUpTask({
          title: `Holiday request pending: ${request.name} (${request.holidayDate})`,
          category: 'HOLIDAY',
          relatedEntityType: 'holiday_request',
          relatedEntityId: request.id,
          autoAssign: true,
          preferredCommunity: request.community ?? request.branch,
          payload: { event: 'HOLIDAY_REQUEST_PENDING' },
        });
        followUpsCreated += 1;
      }
    } catch {
      // Holiday module may be unavailable before migrations.
    }
  }

  if (enabled.has('Executive report schedule')) {
    executivePackRecipients = await notifyExecutivesOfPack(
      `Scheduled executive pack evaluated (${new Date().toISOString().slice(0, 10)}). Open Executive Intelligence for branded PDF/Excel exports.`,
    );
  }

  inactiveSuperAdminNudges = await processInactiveSuperAdminReengagement();

  if (!isDatabaseEnabled()) {
    return {
      rulesEnsured,
      remindersEvaluated,
      escalationsEvaluated,
      followUpsCreated,
      executivePackRecipients,
      inactiveSuperAdminNudges,
      runId: null,
    };
  }

  const db = getDb();
  const runId = uuidv7();
  await db.insert(automationRuns).values({
    id: runId,
    status: 'SUCCEEDED',
    summary: 'Daily automation pass completed',
    details: {
      remindersEvaluated,
      escalationsEvaluated,
      followUpsCreated,
      executivePackRecipients,
      inactiveSuperAdminNudges,
      reminderOffsets: [...PAYMENT_REMINDER_OFFSETS_DAYS],
      escalationThresholds: [...OVERDUE_ESCALATION_DAYS],
      note: 'Payment reminder SMS/email/push continue via the existing notification scheduler; this pass records heartbeat, follow-ups, executive pack alerts, and inactive Super Admin nudges.',
    },
    finishedAt: new Date(),
  });

  return {
    rulesEnsured,
    remindersEvaluated,
    escalationsEvaluated,
    followUpsCreated,
    executivePackRecipients,
    inactiveSuperAdminNudges,
    runId,
  };
}

export async function listOpenAutomationTasks(assigneeUserId?: string) {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const db = getDb();
  if (assigneeUserId) {
    return db
      .select()
      .from(automationTasks)
      .where(eq(automationTasks.assigneeUserId, assigneeUserId))
      .orderBy(desc(automationTasks.createdAt));
  }
  return db.select().from(automationTasks).orderBy(desc(automationTasks.createdAt)).limit(100);
}
