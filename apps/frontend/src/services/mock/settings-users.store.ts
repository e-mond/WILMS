import { MOCK_SETTINGS_USERS } from '@/mocks/settings-users';
import type { SettingsUserRecord } from '@/types/settings';
import { resolveSettingsUserPresentation } from '@/utils/settings-user-presentation';

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

let users: SettingsUserRecord[] = MOCK_SETTINGS_USERS.map((entry) => ({ ...entry }));
let nextUserSequence = users.length + 1;

function cloneUsers(): SettingsUserRecord[] {
  return users.map((entry) => ({ ...entry }));
}

export function getSettingsUsersStore(): SettingsUserRecord[] {
  return cloneUsers();
}

export function resetSettingsUsersStore(): void {
  users = MOCK_SETTINGS_USERS.map((entry) => ({ ...entry }));
  nextUserSequence = users.length + 1;
}

export function createSettingsUser(input: CreateSettingsUserInput): SettingsUserRecord {
  const presentation = resolveSettingsUserPresentation(input.role);
  const created: SettingsUserRecord = {
    id: `user-${String(nextUserSequence).padStart(3, '0')}`,
    displayId: `USR-${String(nextUserSequence).padStart(6, '0')}`,
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    roleLabel: presentation.roleLabel,
    roleTone: presentation.roleTone,
    lastLoginLabel: 'Invited',
    status: 'INVITED',
  };

  nextUserSequence += 1;
  users = [...users, created];
  return { ...created };
}

export function updateSettingsUser(id: string, input: UpdateSettingsUserInput): SettingsUserRecord {
  const index = users.findIndex((entry) => entry.id === id);

  if (index === -1) {
    throw new Error('Settings user not found');
  }

  const current = users[index]!;
  const role = input.role ?? current.role;
  const presentation = resolveSettingsUserPresentation(role);
  const updated: SettingsUserRecord = {
    ...current,
    ...input,
    role,
    roleLabel: presentation.roleLabel,
    roleTone: presentation.roleTone,
  };

  users = [...users.slice(0, index), updated, ...users.slice(index + 1)];
  return { ...updated };
}

export function disableSettingsUser(id: string): SettingsUserRecord {
  return updateSettingsUser(id, { status: 'SUSPENDED' });
}

export function activateSettingsUser(id: string): SettingsUserRecord {
  return updateSettingsUser(id, { status: 'ACTIVE' });
}

export function deleteSettingsUser(id: string): void {
  const current = users.find((entry) => entry.id === id);

  if (!current) {
    throw new Error('Settings user not found');
  }

  if (current.isCurrentUser) {
    throw new Error('Cannot delete the current user');
  }

  users = users.filter((entry) => entry.id !== id);
}
