/**
 * SQL-first audience resolution for Communication Center broadcasts.
 * Staff recipients come from `users`; borrowers/groups from portfolio tables.
 */
import { and, eq, inArray, isNotNull, isNull, notInArray } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { borrowers } from '../../db/schema/borrowers.js';
import { groupMembers, groups } from '../../db/schema/groups.js';
import { users } from '../../db/schema/users.js';

export type AudienceType =
  | 'ALL_USERS'
  | 'ALL_BORROWERS'
  | 'ALL_COLLECTORS'
  | 'ALL_OFFICERS'
  | 'ALL_APPROVERS'
  | 'ALL_ADMINS'
  | 'ALL_AUDITORS'
  | 'ALL_GROUP_LEADERS'
  | 'SPECIFIC_USER'
  | 'SPECIFIC_BORROWERS'
  | 'SPECIFIC_GROUP'
  | 'SPECIFIC_GROUPS'
  | 'CUSTOM';

export interface AudienceRecipient {
  userId?: string;
  borrowerId?: string;
  email?: string;
  phone?: string;
  displayName: string;
}

export interface AudiencePreview {
  total: number;
  sample: AudienceRecipient[];
  channelsHint: Array<'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH'>;
}

const EXCLUDED_BORROWER_STATUSES = [BORROWER_STATUS.REJECTED, BORROWER_STATUS.BLACKLISTED] as const;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function profileEmail(profile: unknown): string | undefined {
  if (!profile || typeof profile !== 'object') {
    return undefined;
  }
  const email = (profile as { email?: unknown }).email;
  return typeof email === 'string' && email.trim() ? email.trim() : undefined;
}

function recipientKey(recipient: AudienceRecipient): string {
  if (recipient.userId) {
    return `user:${recipient.userId}`;
  }
  if (recipient.borrowerId) {
    return `borrower:${recipient.borrowerId}`;
  }
  return `contact:${recipient.email ?? ''}:${recipient.phone ?? ''}:${recipient.displayName}`;
}

export function mergeRecipients(lists: AudienceRecipient[][]): AudienceRecipient[] {
  const byKey = new Map<string, AudienceRecipient>();
  for (const list of lists) {
    for (const recipient of list) {
      const key = recipientKey(recipient);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, recipient);
        continue;
      }
      byKey.set(key, {
        ...existing,
        ...recipient,
        email: recipient.email ?? existing.email,
        phone: recipient.phone ?? existing.phone,
      });
    }
  }
  return [...byKey.values()];
}

function channelsHintFor(recipients: AudienceRecipient[]): AudiencePreview['channelsHint'] {
  const hint = new Set<AudiencePreview['channelsHint'][number]>();
  for (const recipient of recipients) {
    if (recipient.email) hint.add('EMAIL');
    if (recipient.phone) hint.add('SMS');
    if (recipient.userId) {
      hint.add('IN_APP');
      hint.add('PUSH');
    }
  }
  return [...hint];
}

async function resolveActiveUsers(role?: string, userIds?: string[]): Promise<AudienceRecipient[]> {
  const db = getDb();
  const conditions = [isNull(users.deletedAt), eq(users.status, 'ACTIVE')];
  if (role) {
    conditions.push(eq(users.role, role as 'SUPER_ADMIN' | 'COLLECTOR' | 'REGISTRATION_OFFICER' | 'APPROVER' | 'AUDITOR'));
  }
  if (userIds && userIds.length > 0) {
    conditions.push(inArray(users.id, userIds));
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .where(and(...conditions));

  return rows.map((row) => ({
    userId: row.id,
    email: row.email,
    phone: row.phone ?? undefined,
    displayName: row.displayName,
  }));
}

async function resolveBorrowersByIds(borrowerIds: string[]): Promise<AudienceRecipient[]> {
  if (borrowerIds.length === 0) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      id: borrowers.id,
      fullName: borrowers.fullName,
      phone: borrowers.phone,
      profile: borrowers.profile,
      status: borrowers.status,
    })
    .from(borrowers)
    .where(
      and(
        isNull(borrowers.deletedAt),
        inArray(borrowers.id, borrowerIds),
        notInArray(borrowers.status, [...EXCLUDED_BORROWER_STATUSES]),
      ),
    );

  return rows.map((row) => ({
    borrowerId: row.id,
    displayName: row.fullName,
    phone: row.phone || undefined,
    email: profileEmail(row.profile),
  }));
}

async function resolveAllBorrowers(): Promise<AudienceRecipient[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: borrowers.id,
      fullName: borrowers.fullName,
      phone: borrowers.phone,
      profile: borrowers.profile,
    })
    .from(borrowers)
    .where(
      and(
        isNull(borrowers.deletedAt),
        notInArray(borrowers.status, [...EXCLUDED_BORROWER_STATUSES]),
      ),
    );

  return rows.map((row) => ({
    borrowerId: row.id,
    displayName: row.fullName,
    phone: row.phone || undefined,
    email: profileEmail(row.profile),
  }));
}

async function resolveGroupMembers(
  groupIds: string[],
  leaderOnly = false,
): Promise<AudienceRecipient[]> {
  if (groupIds.length === 0) {
    return [];
  }

  const db = getDb();

  if (leaderOnly) {
    const leaderRows = await db
      .select({
        leaderBorrowerId: groups.leaderBorrowerId,
      })
      .from(groups)
      .where(
        and(
          isNull(groups.deletedAt),
          inArray(groups.id, groupIds),
          isNotNull(groups.leaderBorrowerId),
        ),
      );

    const leaderIds = [
      ...new Set(
        leaderRows
          .map((row) => row.leaderBorrowerId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    return resolveBorrowersByIds(leaderIds);
  }

  const memberRows = await db
    .select({
      borrowerId: groupMembers.borrowerId,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(
      and(
        isNull(groups.deletedAt),
        isNull(groupMembers.removedAt),
        inArray(groupMembers.groupId, groupIds),
      ),
    );

  const borrowerIds = [...new Set(memberRows.map((row) => row.borrowerId))];
  return resolveBorrowersByIds(borrowerIds);
}

async function resolveAllGroupLeaders(): Promise<AudienceRecipient[]> {
  const db = getDb();
  const leaderRows = await db
    .select({
      leaderBorrowerId: groups.leaderBorrowerId,
    })
    .from(groups)
    .where(and(isNull(groups.deletedAt), isNotNull(groups.leaderBorrowerId)));

  const leaderIds = [
    ...new Set(
      leaderRows
        .map((row) => row.leaderBorrowerId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  return resolveBorrowersByIds(leaderIds);
}

export async function resolveAudienceRecipients(
  audienceType: AudienceType,
  filter?: Record<string, unknown>,
): Promise<AudienceRecipient[]> {
  if (!isDatabaseEnabled()) {
    return [{ userId: 'user-super-admin', email: 'admin@wilms.demo', displayName: 'Admin' }];
  }

  switch (audienceType) {
    case 'ALL_COLLECTORS':
      return resolveActiveUsers(USER_ROLE.COLLECTOR);
    case 'ALL_OFFICERS':
      return resolveActiveUsers(USER_ROLE.REGISTRATION_OFFICER);
    case 'ALL_APPROVERS':
      return resolveActiveUsers(USER_ROLE.APPROVER);
    case 'ALL_ADMINS':
      return resolveActiveUsers(USER_ROLE.SUPER_ADMIN);
    case 'ALL_AUDITORS':
      return resolveActiveUsers(USER_ROLE.AUDITOR);
    case 'SPECIFIC_USER': {
      const userId = String(filter?.userId ?? '').trim();
      return userId ? resolveActiveUsers(undefined, [userId]) : [];
    }
    case 'ALL_BORROWERS':
      return resolveAllBorrowers();
    case 'SPECIFIC_BORROWERS':
      return resolveBorrowersByIds(asStringArray(filter?.borrowerIds));
    case 'SPECIFIC_GROUP': {
      const groupId = String(filter?.groupId ?? '').trim();
      const leaderOnly = Boolean(filter?.leaderOnly);
      return groupId ? resolveGroupMembers([groupId], leaderOnly) : [];
    }
    case 'SPECIFIC_GROUPS': {
      const groupIds = asStringArray(filter?.groupIds);
      const leaderOnly = Boolean(filter?.leaderOnly);
      return resolveGroupMembers(groupIds, leaderOnly);
    }
    case 'ALL_GROUP_LEADERS':
      return resolveAllGroupLeaders();
    case 'CUSTOM': {
      const roles = asStringArray(filter?.roles);
      const borrowerIds = asStringArray(filter?.borrowerIds);
      const groupIds = asStringArray(filter?.groupIds);
      const leaderOnly = Boolean(filter?.leaderOnly);
      const roleLists = await Promise.all(
        roles.map((role) => resolveActiveUsers(role)),
      );
      const borrowerList = await resolveBorrowersByIds(borrowerIds);
      const groupList = await resolveGroupMembers(groupIds, leaderOnly);
      return mergeRecipients([...roleLists, borrowerList, groupList]);
    }
    case 'ALL_USERS':
    default:
      return resolveActiveUsers();
  }
}

export async function previewAudience(
  audienceType: AudienceType,
  filter?: Record<string, unknown>,
  sampleLimit = 20,
): Promise<AudiencePreview> {
  const recipients = await resolveAudienceRecipients(audienceType, filter);
  return {
    total: recipients.length,
    sample: recipients.slice(0, Math.max(1, Math.min(sampleLimit, 100))),
    channelsHint: channelsHintFor(recipients),
  };
}

/** Exported for unit tests — string array helper. */
export const audienceFilterHelpers = { asStringArray, mergeRecipients, profileEmail };
