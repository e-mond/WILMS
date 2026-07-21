import { and, eq, isNull, sql } from 'drizzle-orm';
import { PERMISSION, USER_ROLE, type UserRole } from '@wilms/shared-rbac';
import { formatUserDisplayId } from '@wilms/shared-utils';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { auditEntries } from '../../db/schema/audit.js';
import { permissions, rolePermissions, roles, userPermissionOverrides, userRoles } from '../../db/schema/rbac.js';
import { users } from '../../db/schema/users.js';
import { hashPassword } from '../../lib/password.js';
import { generateInvitePassword } from '../../lib/invite-password.js';
import { computeInvitationExpiresAt } from '../../lib/invitation-expiry.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import * as userRepo from '../../repositories/user.repository.js';
import * as systemSettingsRepo from '../../repositories/system-settings.repository.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { getIntegrationStatus } from '../../infrastructure/integrations/status.js';
import { listMessageDeliveries } from '../../infrastructure/notifications/delivery-log.js';
import { getSmsProvider } from '../../infrastructure/sms/index.js';
import { normalizeGhanaPhone, isValidGhanaMobile } from '../../infrastructure/sms/normalize-phone.js';
import { getSmsConfig } from '../../infrastructure/sms/config.js';
import { fetchSmsNotifyGhBalance } from '../../infrastructure/sms/smsnotifygh-adapter.js';
import { notifyUserInvitation, notifyAccountActivated, notifyAccountDisabled, notifyAccountEnabled, notifyUserRoleChanged, notifyWelcome } from '../../infrastructure/notifications/event-dispatch.js';
import { resolveBaseRolePermissions } from '../../infrastructure/permissions/resolve-user-permissions.js';
import { invalidateUserSessions } from '../auth/session.service.js';
import { permanentlyDeleteUser } from '../users/purge.service.js';
import { dispatchMail, isMailDeliveryConfigured } from '../../infrastructure/mail/dispatch.js';
import { mapDatabaseError } from '../../lib/db-errors.js';
import {
  DEFAULT_SYSTEM_SETTINGS,
  mapSystemSettingsRow,
  type SystemSettingsDto,
} from './settings-mapper.js';

export type SystemSettings = SystemSettingsDto;

export interface SettingsUserRecord {
  id: string;
  displayId: string;
  displayName: string;
  email: string;
  role: string;
  roleLabel: string;
  roleTone: 'gold' | 'primary' | 'info' | 'muted';
  lastLoginLabel: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  isCurrentUser?: boolean;
  photoUrl?: string | null;
  invitationEmailSent?: boolean;
  invitationEmailStatus?: 'PENDING' | 'SENT' | 'FAILED';
  invitationEmailError?: string | null;
  invitationSmsStatus?: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  invitationSmsError?: string | null;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  firstLoginAt?: string | null;
  statusLabel?: string;
}

export interface SettingsActivityEntry {
  id: string;
  title: string;
  occurredAt: string;
  actorLabel: string;
}

export interface PermissionDefinition {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
  isSystem: boolean;
  userCount: number;
}

export interface CreateSettingsUserInput {
  displayName: string;
  email: string;
  role: string;
  phone?: string;
}

export interface UpdateSettingsUserInput {
  displayName?: string;
  email?: string;
  role?: string;
  status?: SettingsUserRecord['status'];
}

export interface UpdateSystemSettingsInput {
  adminFeePesewas?: number;
  reconciliationVarianceThresholdPercent?: number;
  smsNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  paymentReminderDaysBefore?: number;
  minGroupSize?: number;
  maxGroupSize?: number;
  organisationName?: string;
  systemName?: string;
  primaryColour?: string;
  accentColour?: string;
  logoAsset?: string;
  sessionTimeoutMinutes?: number;
  twoFactorRequired?: boolean;
  ipAllowlistEnabled?: boolean;
  failedLoginLockoutAttempts?: number;
  passwordPolicy?: string;
  maxLoanAmountPesewas?: number;
  defaultLoanDurationWeeks?: number;
  allowLoanRollovers?: boolean;
  latePaymentGraceDays?: number;
  smsProvider?: string;
  smsSenderId?: string;
  missedPaymentSmsEnabled?: boolean;
  approvalSmsEnabled?: boolean;
  supervisorEscalationsEnabled?: boolean;
  immutableAuditTrail?: boolean;
  auditExportEnabled?: boolean;
  monitoringAlertsEnabled?: boolean;
  gpsVerificationEnabled?: boolean;
  emailProviderLabel?: string;
}

export interface SettingsMeProfile {
  id: string;
  displayName: string;
  email: string;
  role: string;
  roleLabel: string;
  phone?: string;
}

export interface UpdateSettingsMeInput {
  displayName?: string;
  email?: string;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface SettingsUserProfile {
  id: string;
  displayName: string;
  staffId: string;
  role: string;
  roleLabel: string;
  status: SettingsUserRecord['status'];
  phone: string;
  email: string;
  branch: string;
  region: string;
  zone: string;
  profileImageUrl?: string;
  assignedGroups: string[];
  assignedBorrowers: number;
  assignedPermissionIds: string[];
  delegatedPermissionIds: string[];
  lastLoginAt: string;
  activityHistory: Array<{ id: string; title: string; occurredAt: string }>;
  loginHistory: Array<{ id: string; occurredAt: string; deviceLabel: string; locationLabel: string }>;
  deviceHistory: Array<{ id: string; deviceLabel: string; lastSeenAt: string; platform: string }>;
  auditHistory: Array<{ id: string; action: string; targetLabel: string; occurredAt: string }>;
  performanceMetrics: {
    collectionRatePercent: number;
    dailyCollectedPesewas: number;
    weeklyCollectedPesewas: number;
    monthlyCollectedPesewas: number;
    borrowersManaged: number;
    expenseTotalPesewas?: number;
  };
  approvalMetrics?: {
    approvalsCount: number;
    rejectionsCount: number;
    pendingQueueCount: number;
  };
  registrationMetrics?: {
    registrationsCompleted: number;
    pendingRegistrations: number;
  };
}

export interface RegistrationLegalConfig {
  programName: string;
  formTitle: string;
  instructionText: string;
  programDeclaration: string;
  guarantorDeclaration: string;
  borrowerDeclaration: string;
  keyTerms: string;
  legalNotice: string;
  updatedAt: string;
}

const ROLE_PRESENTATION: Record<string, Pick<SettingsUserRecord, 'roleLabel' | 'roleTone'>> = {
  [USER_ROLE.SUPER_ADMIN]: { roleLabel: 'Super Admin', roleTone: 'gold' },
  [USER_ROLE.APPROVER]: { roleLabel: 'Approver', roleTone: 'primary' },
  [USER_ROLE.COLLECTOR]: { roleLabel: 'Collector', roleTone: 'info' },
  [USER_ROLE.REGISTRATION_OFFICER]: { roleLabel: 'Registration Officer', roleTone: 'primary' },
  [USER_ROLE.AUDITOR]: { roleLabel: 'Auditor', roleTone: 'muted' },
};

const PERMISSION_DEFINITIONS: PermissionDefinition[] = Object.values(PERMISSION).map((id) => ({
  id,
  label: id.replace(/-/g, ' '),
  description: id,
  category: 'System',
}));

const REGISTRATION_LEGAL_CONFIG: RegistrationLegalConfig = {
  programName: "Women's Interest-Free Loan Programme",
  formTitle: 'LOAN APPLICATION & AGREEMENT FORM',
  instructionText:
    'Complete all sections accurately. Passport-style photographs are required. Signatures may be captured digitally or applied manually after printing this form.',
  programDeclaration:
    'I apply to join the programme and confirm that I understand membership requirements, group obligations, and the role of my guarantor in this interest-free lending initiative.',
  guarantorDeclaration:
    'I confirm that I understand my responsibility as guarantor for the applicant named in this form. I agree to support programme compliance and repayment obligations as defined in the key terms below.',
  borrowerDeclaration:
    'I confirm that the information provided in this application is accurate and complete. I consent to WILMS processing my data for registration, eligibility assessment, and programme administration.',
  keyTerms:
    'Membership in an approved group is required. Guarantor consent must be recorded before submission. GPS verification is mandatory for rural registrations. Weekly repayments apply only after a separate loan application is approved and disbursed.',
  legalNotice:
    'This registration package is governed by WILMS microfinance regulations and may be audited by compliance officers. Loan amounts, disbursement schedules, and repayment terms are established only through separate loan application and approval processes.',
  updatedAt: '2026-06-01T08:00:00.000Z',
};

let systemSettings: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

const memoryRoles: RoleDefinition[] = [
  {
    id: 'role-collector',
    name: 'Collector',
    description: 'Field collections and assigned borrower management',
    permissionIds: [
      PERMISSION.ACCESS_COLLECTOR_PORTAL,
      PERMISSION.REGISTER_BORROWERS,
      PERMISSION.MANAGE_GROUPS,
      PERMISSION.VIEW_ASSIGNED_BORROWERS,
      PERMISSION.RECORD_COLLECTIONS,
      PERMISSION.RECORD_EXPENSES,
    ],
    isSystem: true,
    userCount: 1,
  },
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Full platform administration',
    permissionIds: PERMISSION_DEFINITIONS.map((permission) => permission.id),
    isSystem: true,
    userCount: 1,
  },
];

function resolveRolePresentation(role: string) {
  return ROLE_PRESENTATION[role] ?? { roleLabel: role, roleTone: 'muted' as const };
}

function formatLastLoginLabel(
  lastLoginAt: Date | null | undefined,
  row?: Pick<typeof users.$inferSelect, 'status' | 'firstLoginAt' | 'acceptedAt'>,
): string {
  if (row?.status === 'INVITED' && !row.firstLoginAt) {
    return 'Not yet';
  }
  if (!lastLoginAt) {
    return 'Never';
  }
  return lastLoginAt.toISOString().slice(0, 10);
}

function resolveUserStatusLabel(
  row: Pick<typeof users.$inferSelect, 'status' | 'firstLoginAt' | 'acceptedAt'>,
): string {
  if (row.status === 'ACTIVE') {
    return 'Active';
  }
  if (row.status === 'SUSPENDED') {
    return 'Suspended';
  }
  if (row.status === 'INVITED') {
    if (row.firstLoginAt) {
      return 'Pending setup';
    }
    if (row.acceptedAt) {
      return 'Accepted';
    }
    return 'Invited';
  }
  return row.status;
}

function mapUserRowToSettingsRecord(
  row: typeof users.$inferSelect,
  currentUserId?: string,
  sequence?: number,
): SettingsUserRecord {
  const presentation = resolveRolePresentation(row.role);
  return {
    id: row.id,
    displayId: formatUserDisplayId({ staffId: row.staffId ?? undefined, id: row.id, sequence }),
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    roleLabel: presentation.roleLabel,
    roleTone: presentation.roleTone,
    lastLoginLabel: formatLastLoginLabel(row.lastLoginAt, row),
    status: row.status,
    statusLabel: resolveUserStatusLabel(row),
    isCurrentUser: currentUserId ? row.id === currentUserId : undefined,
    invitedAt: row.invitedAt?.toISOString() ?? null,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    firstLoginAt: row.firstLoginAt?.toISOString() ?? null,
  };
}

function mapDemoUserToSettingsRecord(
  user: (typeof DEMO_USERS)[number],
  sequence?: number,
): SettingsUserRecord {
  const presentation = resolveRolePresentation(user.role);
  return {
    id: user.id,
    displayId: formatUserDisplayId({ id: user.id, sequence }),
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    roleLabel: presentation.roleLabel,
    roleTone: presentation.roleTone,
    lastLoginLabel: 'Never',
    status: user.status ?? 'ACTIVE',
  };
}

export async function getSettings(): Promise<SystemSettings> {
  const integrationStatus = getIntegrationStatus();

  if (!isDatabaseEnabled()) {
    return { ...systemSettings, integrationStatus };
  }

  const row = await systemSettingsRepo.getSystemSettingsRow();
  return { ...mapSystemSettingsRow(row), integrationStatus };
}

function validateGroupSizeRules(minGroupSize: number, maxGroupSize: number): void {
  if (minGroupSize < 1) {
    throw new Error('VALIDATION:Minimum group size must be at least 1.');
  }

  if (maxGroupSize < minGroupSize) {
    throw new Error('VALIDATION:Maximum group size cannot be less than minimum group size.');
  }
}

export async function updateSettings(
  input: UpdateSystemSettingsInput,
  actorId?: string,
): Promise<SystemSettings> {
  const current = await getSettings();
  const minGroupSize = input.minGroupSize ?? current.minGroupSize;
  const maxGroupSize = input.maxGroupSize ?? current.maxGroupSize;
  validateGroupSizeRules(minGroupSize, maxGroupSize);

  if (!isDatabaseEnabled()) {
    systemSettings = {
      ...current,
      ...input,
      minGroupSize,
      maxGroupSize,
      updatedAt: new Date().toISOString(),
    };
    if (actorId) {
      appendAuditEntry({
        action: 'settings.updated',
        actorId,
        targetEntityId: 'system-settings',
        targetEntityType: 'settings',
        reason: 'System settings updated',
      });
    }
    return { ...systemSettings };
  }

  const row = await systemSettingsRepo.updateSystemSettingsRow({
    ...input,
    minGroupSize,
    maxGroupSize,
  });

  if (actorId) {
    appendAuditEntry({
      action: 'settings.updated',
      actorId,
      targetEntityId: 'system-settings',
      targetEntityType: 'settings',
      reason: 'System settings updated',
    });
  }

  return mapSystemSettingsRow(row);
}

export async function getSettingsMe(userId: string): Promise<SettingsMeProfile> {
  if (!isDatabaseEnabled()) {
    const demo = DEMO_USERS.find((user) => user.id === userId);
    if (!demo) {
      throw new Error('NOT_FOUND');
    }
    const presentation = resolveRolePresentation(demo.role);
    return {
      id: demo.id,
      displayName: demo.displayName,
      email: demo.email,
      role: demo.role,
      roleLabel: presentation.roleLabel,
    };
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const presentation = resolveRolePresentation(row.role);
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    roleLabel: presentation.roleLabel,
    phone: row.phone ?? undefined,
  };
}

export async function updateSettingsMe(
  userId: string,
  input: UpdateSettingsMeInput,
): Promise<SettingsMeProfile> {
  if (!isDatabaseEnabled()) {
    const demo = DEMO_USERS.find((user) => user.id === userId);
    if (!demo) {
      throw new Error('NOT_FOUND');
    }
    const presentation = resolveRolePresentation(demo.role);
    return {
      id: demo.id,
      displayName: input.displayName?.trim() ?? demo.displayName,
      email: input.email?.trim().toLowerCase() ?? demo.email,
      role: demo.role,
      roleLabel: presentation.roleLabel,
    };
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      displayName: input.displayName?.trim() ?? row.displayName,
      email: input.email?.trim().toLowerCase() ?? row.email,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return getSettingsMe(userId);
}

export function getIntegrationsStatus() {
  return getIntegrationStatus();
}

export async function getDeliveryLogs(input?: { event?: string; recipient?: string; limit?: number }) {
  return listMessageDeliveries(input);
}

export async function sendTestSms(userId: string, phone: string): Promise<{ ok: true }> {
  const normalizedPhone = normalizeGhanaPhone(phone.trim());
  if (!normalizedPhone) {
    throw new Error('VALIDATION:Phone number is required for test SMS.');
  }
  if (!isValidGhanaMobile(phone)) {
    throw new Error('VALIDATION:Enter a valid Ghana mobile number (e.g. 0241234567).');
  }

  const integration = getIntegrationStatus();
  const provider = getSmsProvider();
  if (!provider.isConfigured()) {
    throw new Error(`VALIDATION:SMS provider is not configured. ${integration.sms.setupHint}`);
  }

  const settings = await getSettings();
  const profile = await getSettingsMe(userId);
  const smsConfig = getSmsConfig();

  await provider.send({
    to: normalizedPhone,
    body: `WILMS test SMS for ${profile.displayName}. Sender: ${settings.smsSenderId}. Provider: ${smsConfig.provider}.`,
  });

  return { ok: true };
}

export async function sendTestEmail(userId: string, email: string): Promise<{ ok: true }> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error('VALIDATION:Email address is required for test email.');
  }

  const integration = getIntegrationStatus();
  if (!isMailDeliveryConfigured()) {
    throw new Error(`VALIDATION:Mail provider is not configured. ${integration.mail.setupHint}`);
  }

  const profile = await getSettingsMe(userId);
  const providerLabel = integration.mail.provider;

  await dispatchMail({
    event: 'MAIL_TEST',
    to: normalizedEmail,
    subject: 'WILMS test email',
    text: `Hello ${profile.displayName}, this is a test email from WILMS (${providerLabel}).`,
    html: `<p>Hello <strong>${profile.displayName}</strong>,</p><p>This is a test email from WILMS (${providerLabel}).</p>`,
    userId,
    enableTracking: false,
    maxRetries: 0,
  });

  return { ok: true };
}

export async function getSmsBalance(): Promise<{ balance: string }> {
  const integration = getIntegrationStatus();
  if (!integration.sms.configured) {
    throw new Error(`VALIDATION:SMS provider is not configured. ${integration.sms.setupHint}`);
  }

  const result = await fetchSmsNotifyGhBalance();
  return { balance: result.balance };
}

export async function listUsers(currentUserId?: string): Promise<SettingsUserRecord[]> {
  if (!isDatabaseEnabled()) {
    return DEMO_USERS.map((user, index) => ({
      ...mapDemoUserToSettingsRecord(user, index + 1),
      isCurrentUser: user.id === currentUserId,
    }));
  }

  const rows = await userRepo.listUsers();
  const sorted = [...rows].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const sequenceById = new Map(sorted.map((row, index) => [row.id, index + 1]));

  return rows.map((row) => mapUserRowToSettingsRecord(row, currentUserId, sequenceById.get(row.id)));
}

export async function getUserProfile(userId: string): Promise<SettingsUserProfile> {
  if (!isDatabaseEnabled()) {
    const demo = DEMO_USERS.find((user) => user.id === userId);
    if (!demo) {
      throw new Error('NOT_FOUND');
    }
    const presentation = resolveRolePresentation(demo.role);
    const assignedPermissionIds = [
      ...(await resolveBaseRolePermissions(demo.id, demo.role as UserRole)),
    ];
    return buildMinimalProfile({
      id: demo.id,
      displayName: demo.displayName,
      email: demo.email,
      role: demo.role,
      roleLabel: presentation.roleLabel,
      status: demo.status ?? 'ACTIVE',
      assignedPermissionIds,
    });
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const presentation = resolveRolePresentation(row.role);
  const assignedPermissionIds = [
    ...(await resolveBaseRolePermissions(row.id, row.role as UserRole)),
  ];
  return buildMinimalProfile({
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    roleLabel: presentation.roleLabel,
    status: row.status,
    staffId: row.staffId ?? '',
    phone: row.phone ?? '',
    branch: row.branch ?? '',
    region: row.region ?? '',
    zone: row.zone ?? '',
    lastLoginAt: row.lastLoginAt?.toISOString() ?? '',
    assignedPermissionIds,
  });
}

function buildMinimalProfile(input: {
  id: string;
  displayName: string;
  email: string;
  role: string;
  roleLabel: string;
  status: SettingsUserRecord['status'];
  staffId?: string;
  phone?: string;
  branch?: string;
  region?: string;
  zone?: string;
  lastLoginAt?: string;
  assignedPermissionIds?: string[];
}): SettingsUserProfile {
  return {
    id: input.id,
    displayName: input.displayName,
    staffId: input.staffId ?? '',
    role: input.role,
    roleLabel: input.roleLabel,
    status: input.status,
    phone: input.phone ?? '',
    email: input.email,
    branch: input.branch ?? '',
    region: input.region ?? '',
    zone: input.zone ?? '',
    assignedGroups: [],
    assignedBorrowers: 0,
    assignedPermissionIds: input.assignedPermissionIds ?? [],
    delegatedPermissionIds: [],
    lastLoginAt: input.lastLoginAt ?? '',
    activityHistory: [],
    loginHistory: [],
    deviceHistory: [],
    auditHistory: [],
    performanceMetrics: {
      collectionRatePercent: 0,
      dailyCollectedPesewas: 0,
      weeklyCollectedPesewas: 0,
      monthlyCollectedPesewas: 0,
      borrowersManaged: 0,
    },
  };
}

export async function getSettingsActivity(): Promise<SettingsActivityEntry[]> {
  if (!isDatabaseEnabled()) {
    return [
      {
        id: 'settings-activity-1',
        title: 'Admin fee updated',
        occurredAt: '2026-06-08',
        actorLabel: 'Super Admin',
      },
    ];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(auditEntries)
    .orderBy(sql`${auditEntries.createdAt} desc`)
    .limit(25);

  return rows.map((row) => ({
    id: row.id,
    title: row.action.replace(/_/g, ' '),
    occurredAt: row.createdAt.toISOString(),
    actorLabel: row.actorDisplayName ?? 'System',
  }));
}

export async function listPermissions(): Promise<PermissionDefinition[]> {
  if (!isDatabaseEnabled()) {
    return PERMISSION_DEFINITIONS.map((permission) => ({ ...permission }));
  }

  const db = getDb();
  const rows = await db.select().from(permissions);
  if (rows.length === 0) {
    return PERMISSION_DEFINITIONS.map((permission) => ({ ...permission }));
  }

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    description: row.description ?? row.label,
    category: row.category ?? 'System',
  }));
}

async function loadRoleDefinitionsFromDb(): Promise<RoleDefinition[]> {
  const db = getDb();
  const roleRows = await db.select().from(roles).where(isNull(roles.deletedAt));
  const permissionRows = await db.select().from(rolePermissions);
  const userRoleCounts = await db
    .select({
      roleId: userRoles.roleId,
      count: sql<number>`count(*)::int`,
    })
    .from(userRoles)
    .groupBy(userRoles.roleId);

  const permissionsByRole = new Map<string, string[]>();
  for (const row of permissionRows) {
    const current = permissionsByRole.get(row.roleId) ?? [];
    current.push(row.permissionId);
    permissionsByRole.set(row.roleId, current);
  }

  const countByRole = new Map(userRoleCounts.map((row) => [row.roleId, row.count]));

  return roleRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? row.name,
    permissionIds: permissionsByRole.get(row.id) ?? [],
    isSystem: row.isSystem,
    userCount: countByRole.get(row.id) ?? 0,
  }));
}

export async function listRoles(): Promise<RoleDefinition[]> {
  if (!isDatabaseEnabled()) {
    return memoryRoles.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));
  }

  const rolesFromDb = await loadRoleDefinitionsFromDb();
  if (rolesFromDb.length === 0) {
    return memoryRoles.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));
  }

  return rolesFromDb;
}

export async function createRole(input: CreateRoleInput): Promise<RoleDefinition> {
  if (!isDatabaseEnabled()) {
    const created: RoleDefinition = {
      id: `role-${String(memoryRoles.length + 1).padStart(3, '0')}`,
      name: input.name.trim(),
      description: input.description.trim(),
      permissionIds: [...input.permissionIds],
      isSystem: false,
      userCount: 0,
    };
    memoryRoles.push(created);
    return { ...created, permissionIds: [...created.permissionIds] };
  }

  const db = getDb();
  const roleId = uuidv7();
  await db.insert(roles).values({
    id: roleId,
    name: input.name.trim(),
    description: input.description.trim(),
    isSystem: false,
  });

  if (input.permissionIds.length > 0) {
    await db.insert(rolePermissions).values(
      input.permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    );
  }

  const match = (await loadRoleDefinitionsFromDb()).find((role) => role.id === roleId);
  if (!match) {
    throw new Error('SERVER');
  }
  return match;
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<RoleDefinition> {
  if (!isDatabaseEnabled()) {
    const index = memoryRoles.findIndex((role) => role.id === id);
    if (index === -1) {
      throw new Error('NOT_FOUND');
    }
    const current = memoryRoles[index]!;
    if (current.isSystem && input.name && input.name !== current.name) {
      throw new Error('VALIDATION:System roles cannot be renamed');
    }
    const updated: RoleDefinition = {
      ...current,
      ...input,
      permissionIds: input.permissionIds ? [...input.permissionIds] : [...current.permissionIds],
    };
    memoryRoles[index] = updated;
    return { ...updated, permissionIds: [...updated.permissionIds] };
  }

  const db = getDb();
  const [current] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
    .limit(1);

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  if (current.isSystem && input.name && input.name !== current.name) {
    throw new Error('VALIDATION:System roles cannot be renamed');
  }

  await db
    .update(roles)
    .set({
      name: input.name?.trim() ?? current.name,
      description: input.description?.trim() ?? current.description,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id));

  if (input.permissionIds) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    if (input.permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        input.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      );
    }
  }

  const match = (await loadRoleDefinitionsFromDb()).find((role) => role.id === id);
  if (!match) {
    throw new Error('NOT_FOUND');
  }
  return match;
}

export async function deleteRole(id: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    const current = memoryRoles.find((role) => role.id === id);
    if (!current) {
      throw new Error('NOT_FOUND');
    }
    if (current.isSystem) {
      throw new Error('VALIDATION:System roles cannot be deleted');
    }
    const index = memoryRoles.findIndex((role) => role.id === id);
    memoryRoles.splice(index, 1);
    return;
  }

  const db = getDb();
  const [current] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
    .limit(1);

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  if (current.isSystem) {
    throw new Error('VALIDATION:System roles cannot be deleted');
  }

  await db
    .update(roles)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(roles.id, id));
}

export async function cloneRole(id: string): Promise<RoleDefinition> {
  const existingRoles = await listRoles();
  const source = existingRoles.find((role) => role.id === id);
  if (!source) {
    throw new Error('NOT_FOUND');
  }

  const cloneName = resolveUniqueRoleCloneName(source.name, existingRoles);

  return createRole({
    name: cloneName,
    description: source.description,
    permissionIds: [...source.permissionIds],
  });
}

function resolveUniqueRoleCloneName(sourceName: string, existingRoles: RoleDefinition[]): string {
  const takenNames = new Set(existingRoles.map((role) => role.name.trim().toLowerCase()));
  const baseName = `${sourceName.trim()} Copy`;

  if (!takenNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (takenNames.has(`${baseName} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${baseName} ${suffix}`;
}

function invitationExpiresAt(): Date {
  return computeInvitationExpiresAt();
}

export async function createUser(
  input: CreateSettingsUserInput,
  actorUserId?: string,
): Promise<SettingsUserRecord> {
  const displayName = input.displayName?.trim();
  const email = input.email?.trim().toLowerCase();
  const role = input.role?.trim();

  if (!displayName) {
    throw new Error('VALIDATION:Full name is required.');
  }

  if (!email || !email.includes('@')) {
    throw new Error('VALIDATION:A valid email address is required.');
  }

  const allowedRoles = Object.values(USER_ROLE) as UserRole[];
  if (!role || !allowedRoles.includes(role as UserRole)) {
    throw new Error('VALIDATION:A valid role is required.');
  }

  if (isDatabaseEnabled()) {
    const existing = await userRepo.findAnyUserByEmail(email);
    if (existing && !existing.deletedAt) {
      if (existing.status === 'INVITED') {
        throw new Error('CONFLICT:An invitation is already pending for this email address.');
      }
      throw new Error('VALIDATION:A user with this email already exists.');
    }
    if (existing?.deletedAt) {
      throw new Error(
        'CONFLICT:This email belongs to a deleted account. Restore or permanently remove it before re-inviting.',
      );
    }
  }

  if (!isDatabaseEnabled()) {
    const temporaryPassword = generateInvitePassword();
    const created = mapDemoUserToSettingsRecord({
      id: `user-${uuidv7().slice(0, 8)}`,
      email,
      password: temporaryPassword,
      role: role as (typeof DEMO_USERS)[number]['role'],
      displayName,
      status: 'INVITED',
    });
    created.lastLoginLabel = 'Invited';
    created.status = 'INVITED';
    created.invitationEmailSent = true;
    created.invitationEmailStatus = 'SENT';
    return created;
  }

  const db = getDb();
  const temporaryPassword = generateInvitePassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const userId = uuidv7();
  const expiresAt = invitationExpiresAt();
  const invitedAt = new Date();

  try {
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      displayName,
      phone: input.phone?.trim() || null,
      role: role as typeof users.$inferInsert.role,
      status: 'INVITED',
      invitedAt,
    });
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('SERVER');
  }

  appendAuditEntry({
    action: 'user.invited',
    actorId: actorUserId ?? 'system',
    targetEntityId: userId,
    targetEntityType: 'user',
    reason: `email=${email} role=${role}`,
  });

  const record = mapUserRowToSettingsRecord(row);
  record.lastLoginLabel = 'Not yet';
  record.invitationEmailSent = false;
  record.invitationEmailStatus = 'PENDING';
  record.invitationEmailError = null;
  record.invitationSmsStatus = input.phone?.trim() ? 'PENDING' : 'SKIPPED';
  record.invitationSmsError = null;

  try {
    const { issueInvitationToken } = await import('../auth/invitation-token.service.js');
    const issued = await issueInvitationToken({
      userId,
      expiresAt,
      actorUserId: actorUserId,
    });

    const delivery = await notifyUserInvitation({
      email,
      displayName,
      temporaryPassword,
      userId,
      phone: input.phone?.trim(),
      expiresAt: issued.expiresAt,
      invitationToken: issued.rawToken,
    });

    record.invitationEmailSent = delivery.emailSent;
    record.invitationEmailStatus = delivery.emailSent ? 'SENT' : 'FAILED';
    record.invitationEmailError = delivery.emailError ?? null;

    if (input.phone?.trim()) {
      record.invitationSmsStatus = delivery.smsSent ? 'SENT' : 'FAILED';
      record.invitationSmsError = delivery.smsError ?? null;
    }

    if (!delivery.emailSent && delivery.emailError) {
      console.error('[settings] invitation email failed:', delivery.emailError);
    }
    if (input.phone?.trim() && !delivery.smsSent && delivery.smsError) {
      console.error('[settings] invitation SMS failed:', delivery.smsError);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invitation delivery failed.';
    record.invitationEmailStatus = 'FAILED';
    record.invitationEmailError = message;
    if (input.phone?.trim()) {
      record.invitationSmsStatus = 'FAILED';
      record.invitationSmsError = message;
    }
    console.error('[settings] invitation delivery failed:', error);
  }

  return record;
}

export async function resendInvitation(
  userId: string,
  actorUserId?: string,
): Promise<SettingsUserRecord> {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Resend invitation requires database persistence.');
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  if (row.status !== 'INVITED') {
    throw new Error('VALIDATION:Only invited users can receive a resent invitation email.');
  }

  const invitedAt = new Date();
  const expiresAt = invitationExpiresAt();
  const temporaryPassword = generateInvitePassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, invitedAt, updatedAt: invitedAt })
    .where(eq(users.id, userId));

  const { issueInvitationToken } = await import('../auth/invitation-token.service.js');
  const issued = await issueInvitationToken({
    userId: row.id,
    expiresAt,
    actorUserId: actorUserId,
  });

  const delivery = await notifyUserInvitation({
    email: row.email,
    displayName: row.displayName,
    temporaryPassword,
    userId: row.id,
    phone: row.phone ?? undefined,
    expiresAt: issued.expiresAt,
    invitationToken: issued.rawToken,
  });

  appendAuditEntry({
    action: 'user.invitation_resent',
    actorId: actorUserId ?? 'system',
    targetEntityId: row.id,
    targetEntityType: 'user',
    reason: `email=${row.email}`,
  });

  const record = mapUserRowToSettingsRecord(row);
  record.lastLoginLabel = formatLastLoginLabel(row.lastLoginAt, row);
  record.invitationEmailSent = delivery.emailSent;
  record.invitationEmailStatus = delivery.emailSent ? 'SENT' : 'FAILED';
  record.invitationEmailError = delivery.emailError ?? null;
  if (row.phone) {
    record.invitationSmsStatus = delivery.smsSent ? 'SENT' : 'FAILED';
    record.invitationSmsError = delivery.smsError ?? null;
  } else {
    record.invitationSmsStatus = 'SKIPPED';
  }
  return record;
}

export async function updateUser(
  id: string,
  input: UpdateSettingsUserInput,
): Promise<SettingsUserRecord> {
  if (!isDatabaseEnabled()) {
    const demo = DEMO_USERS.find((user) => user.id === id);
    if (!demo) {
      throw new Error('NOT_FOUND');
    }
    const role = input.role ?? demo.role;
    const record = mapDemoUserToSettingsRecord({
      ...demo,
      displayName: input.displayName?.trim() ?? demo.displayName,
      email: input.email?.trim().toLowerCase() ?? demo.email,
      role: role as (typeof DEMO_USERS)[number]['role'],
      status: input.status ?? demo.status,
    });
    if (input.status) {
      record.status = input.status;
    }
    return record;
  }

  const row = await userRepo.getUserById(id);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const previousRole = row.role;
  const db = getDb();
  const role = input.role ?? row.role;
  await db
    .update(users)
    .set({
      displayName: input.displayName?.trim() ?? row.displayName,
      email: input.email?.trim().toLowerCase() ?? row.email,
      role: role as typeof users.$inferInsert.role,
      status: input.status ?? row.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  const updated = await userRepo.getUserById(id);
  if (!updated) {
    throw new Error('NOT_FOUND');
  }
  const record = mapUserRowToSettingsRecord(updated);

  if (input.role && input.role !== previousRole) {
    await invalidateUserSessions(id);
    void notifyUserRoleChanged({
      email: record.email,
      displayName: record.displayName,
      userId: record.id,
      previousRole,
      newRole: input.role,
    });
  }

  if (input.status && input.status !== row.status) {
    await invalidateUserSessions(id);
  }

  return record;
}

export async function disableUser(id: string, actorUserId?: string): Promise<SettingsUserRecord> {
  if (actorUserId && id === actorUserId) {
    const actor = await userRepo.getUserById(actorUserId);
    if (actor?.role === USER_ROLE.SUPER_ADMIN) {
      const peers = await userRepo.listUsers();
      const hasOtherActiveSuperAdmin = peers.some(
        (peer) =>
          peer.id !== actorUserId &&
          peer.role === USER_ROLE.SUPER_ADMIN &&
          peer.status === 'ACTIVE' &&
          !peer.deletedAt,
      );
      if (!hasOtherActiveSuperAdmin) {
        throw new Error(
          'VALIDATION:You cannot suspend your own account unless another active super admin exists.',
        );
      }
    }
  }

  const record = await updateUser(id, { status: 'SUSPENDED' });
  void notifyAccountDisabled({
    email: record.email,
    displayName: record.displayName,
    userId: record.id,
  });
  return record;
}

export async function activateUser(id: string): Promise<SettingsUserRecord> {
  const row = await userRepo.getUserById(id);
  const wasSuspended = row?.status === 'SUSPENDED';
  const record = await updateUser(id, { status: 'ACTIVE' });
  if (wasSuspended) {
    void notifyAccountEnabled({
      email: record.email,
      displayName: record.displayName,
      userId: record.id,
    });
  } else {
    void notifyAccountActivated({
      email: record.email,
      displayName: record.displayName,
      userId: record.id,
    });
    void notifyWelcome({
      email: record.email,
      displayName: record.displayName,
      role: record.role,
      userId: record.id,
    });
  }
  return record;
}

export async function deleteUser(id: string, currentUserId?: string): Promise<void> {
  if (id === currentUserId) {
    throw new Error('VALIDATION:Cannot delete the current user');
  }

  if (!isDatabaseEnabled()) {
    const demo = DEMO_USERS.find((user) => user.id === id);
    if (!demo) {
      throw new Error('NOT_FOUND');
    }
    return;
  }

  const row = await userRepo.getUserById(id);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  await permanentlyDeleteUser(id, currentUserId);
}

export interface UserPermissionOverrideRecord {
  userId: string;
  permissionId: string;
  granted: boolean;
  reason?: string;
  grantedBy?: string;
  grantedAt: string;
}

export interface UpsertUserPermissionOverrideInput {
  permissionId: string;
  granted: boolean;
  reason?: string;
}

const memoryPermissionOverrides: UserPermissionOverrideRecord[] = [];

export async function listUserPermissionOverrides(
  userId: string,
): Promise<UserPermissionOverrideRecord[]> {
  if (!isDatabaseEnabled()) {
    return memoryPermissionOverrides
      .filter((entry) => entry.userId === userId)
      .map((entry) => ({ ...entry }));
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(userPermissionOverrides)
    .where(eq(userPermissionOverrides.userId, userId));

  return rows.map((row) => ({
    userId: row.userId,
    permissionId: row.permissionId,
    granted: row.granted,
    grantedAt: new Date().toISOString(),
  }));
}

export async function upsertUserPermissionOverrides(
  userId: string,
  overrides: UpsertUserPermissionOverrideInput[],
  actorUserId: string,
  actorDisplayName?: string,
): Promise<UserPermissionOverrideRecord[]> {
  if (!Array.isArray(overrides) || overrides.length === 0) {
    throw new Error('VALIDATION:Provide at least one permission override.');
  }

  let userRole: UserRole | undefined;

  if (!isDatabaseEnabled()) {
    const demoUser = DEMO_USERS.find((entry) => entry.id === userId);
    if (!demoUser) {
      throw new Error('NOT_FOUND');
    }
    userRole = demoUser.role;
  } else {
    const user = await userRepo.getUserById(userId);
    if (!user) {
      throw new Error('NOT_FOUND');
    }
    userRole = user.role as UserRole;
  }

  const rolePermissionsSet = await resolveBaseRolePermissions(userId, userRole);
  const actionable: UpsertUserPermissionOverrideInput[] = [];

  for (const override of overrides) {
    if (
      typeof override?.permissionId !== 'string' ||
      !override.permissionId.trim() ||
      typeof override.granted !== 'boolean'
    ) {
      throw new Error('VALIDATION:Each override must include a permissionId and granted flag.');
    }

    if (
      !Object.values(PERMISSION).includes(
        override.permissionId as (typeof PERMISSION)[keyof typeof PERMISSION],
      )
    ) {
      throw new Error('VALIDATION:One or more permission identifiers are invalid.');
    }

    const alreadyGrantedByRole = rolePermissionsSet.has(
      override.permissionId as (typeof PERMISSION)[keyof typeof PERMISSION],
    );

    if (override.granted && alreadyGrantedByRole) {
      throw new Error(
        'VALIDATION:Cannot grant a permission the user already has through their role. Switch to Revoke, or pick a permission outside the role.',
      );
    }

    if (!override.granted && !alreadyGrantedByRole) {
      throw new Error(
        'VALIDATION:Cannot revoke a permission the user does not receive from their role. Switch to Grant, or pick a role permission.',
      );
    }

    actionable.push(override);
  }

  if (!isDatabaseEnabled()) {
    for (const override of actionable) {
      const index = memoryPermissionOverrides.findIndex(
        (entry) => entry.userId === userId && entry.permissionId === override.permissionId,
      );
      const record: UserPermissionOverrideRecord = {
        userId,
        permissionId: override.permissionId,
        granted: override.granted,
        reason: override.reason?.trim() || undefined,
        grantedBy: actorUserId,
        grantedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        memoryPermissionOverrides[index] = record;
      } else {
        memoryPermissionOverrides.push(record);
      }

      appendAuditEntry({
        action: override.granted ? 'PERMISSION_OVERRIDE_GRANTED' : 'PERMISSION_OVERRIDE_REVOKED',
        actorId: actorUserId,
        actorDisplayName,
        targetEntityId: userId,
        targetEntityType: 'user',
        reason: override.reason?.trim() || override.permissionId,
      });
    }

    return listUserPermissionOverrides(userId);
  }

  const db = getDb();

  for (const override of actionable) {
    await db
      .insert(userPermissionOverrides)
      .values({
        userId,
        permissionId: override.permissionId,
        granted: override.granted,
      })
      .onConflictDoUpdate({
        target: [userPermissionOverrides.userId, userPermissionOverrides.permissionId],
        set: { granted: override.granted },
      });

    appendAuditEntry({
      action: override.granted ? 'PERMISSION_OVERRIDE_GRANTED' : 'PERMISSION_OVERRIDE_REVOKED',
      actorId: actorUserId,
      actorDisplayName,
      targetEntityId: userId,
      targetEntityType: 'user',
      reason: override.reason?.trim() || override.permissionId,
    });
  }

  return listUserPermissionOverrides(userId);
}

export async function deleteUserPermissionOverride(
  userId: string,
  permissionId: string,
  actorUserId: string,
  actorDisplayName?: string,
): Promise<UserPermissionOverrideRecord[]> {
  if (!isDatabaseEnabled()) {
    if (!DEMO_USERS.some((entry) => entry.id === userId)) {
      throw new Error('NOT_FOUND');
    }
  } else {
    const user = await userRepo.getUserById(userId);
    if (!user) {
      throw new Error('NOT_FOUND');
    }
  }

  if (!isDatabaseEnabled()) {
    const index = memoryPermissionOverrides.findIndex(
      (entry) => entry.userId === userId && entry.permissionId === permissionId,
    );
    if (index >= 0) {
      memoryPermissionOverrides.splice(index, 1);
      appendAuditEntry({
        action: 'PERMISSION_OVERRIDE_REMOVED',
        actorId: actorUserId,
        actorDisplayName,
        targetEntityId: userId,
        targetEntityType: 'user',
        reason: permissionId,
      });
    }
    return listUserPermissionOverrides(userId);
  }

  const db = getDb();
  await db
    .delete(userPermissionOverrides)
    .where(
      and(
        eq(userPermissionOverrides.userId, userId),
        eq(userPermissionOverrides.permissionId, permissionId),
      ),
    );

  appendAuditEntry({
    action: 'PERMISSION_OVERRIDE_REMOVED',
    actorId: actorUserId,
    actorDisplayName,
    targetEntityId: userId,
    targetEntityType: 'user',
    reason: permissionId,
  });

  return listUserPermissionOverrides(userId);
}

export function getRegistrationLegalConfig(): RegistrationLegalConfig {
  return { ...REGISTRATION_LEGAL_CONFIG };
}
