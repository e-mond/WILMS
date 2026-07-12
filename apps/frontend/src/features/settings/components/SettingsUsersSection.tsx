'use client';

import { useMemo, useState } from 'react';
import { Avatar, DataTable } from '@/components/data-display';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import {
  SettingsSectionCard,
  SETTINGS_SECTION_ICONS,
} from '@/features/settings/components/SettingsSectionCard';
import { SettingsUserModal } from '@/features/settings/components/SettingsUserModal';
import { SettingsUserProfileModal } from '@/features/settings/components/SettingsUserProfileModal';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsUsers } from '@/features/settings/hooks/useSettingsUsers';
import { useSettingsUserMutations } from '@/features/settings/hooks/useSettingsUserMutations';
import { useToast } from '@/hooks/useToast';
import type { SettingsUserRecord } from '@/types/settings';
import { ApiError } from '@/types/api';
import { formatSettingsUserStatus } from '@/utils/settings-user-presentation';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { cn } from '@/utils/cn';

const ROLE_TONE_CLASS = {
  gold: 'text-executive-gold',
  primary: 'text-brand-primary',
  info: 'text-brand-primary',
  muted: 'text-text-muted',
} as const;

const TABLE_CELL = 'whitespace-nowrap align-middle';
const UsersIcon = SETTINGS_SECTION_ICONS.users;

export function SettingsUsersSection() {
  const toast = useToast();
  const { data: users, isLoading } = useSettingsUsers();
  const { createUser, updateUser, disableUser, activateUser, deleteUser, resendInvitation } = useSettingsUserMutations();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'invite' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<SettingsUserRecord | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (users ?? []).filter((user) => {
      if (!query) {
        return true;
      }

      return (
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.roleLabel.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, users]);

  const isSubmitting =
    createUser.isPending ||
    updateUser.isPending ||
    disableUser.isPending ||
    activateUser.isPending ||
    deleteUser.isPending ||
    resendInvitation.isPending;

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
  }

  async function handleInvite(values: { displayName: string; email: string; role: string }) {
    try {
      const created = await createUser.mutateAsync(values);
      if (created.invitationEmailStatus === 'SENT' || created.invitationEmailSent) {
        toast.success('Invite sent', {
          message: `${values.displayName} was added and the invitation email was sent.`,
        });
      } else {
        toast.success('User invited', {
          message: `${values.displayName} was added. The invitation email is being sent — use Resend invite if it does not arrive.`,
        });
      }
      closeModal();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Check the email address and try again.';
      toast.error('Unable to invite user', { message });
    }
  }

  async function handleResendInvitation(user: SettingsUserRecord) {
    try {
      await resendInvitation.mutateAsync(user.id);
      toast.success('Invitation resent', {
        message: `A new invitation email was sent to ${user.email}.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Try again shortly.';
      toast.error('Unable to resend invitation', { message });
    }
  }

  async function handleEdit(values: { displayName: string; email: string; role: string }) {
    if (!selectedUser) {
      return;
    }

    try {
      await updateUser.mutateAsync({ id: selectedUser.id, input: values });
      toast.success('User updated', { message: `${values.displayName} saved successfully.` });
      closeModal();
    } catch {
      toast.error('Unable to update user', { message: 'Try again shortly.' });
    }
  }

  async function handleDisable() {
    if (!selectedUser) {
      return;
    }

    try {
      await disableUser.mutateAsync(selectedUser.id);
      toast.warning('User suspended', { message: `${selectedUser.displayName} can no longer sign in.` });
      closeModal();
    } catch {
      toast.error('Unable to suspend user', { message: 'Try again shortly.' });
    }
  }

  async function handleActivate() {
    if (!selectedUser) {
      return;
    }

    try {
      await activateUser.mutateAsync(selectedUser.id);
      toast.success('User activated', { message: `${selectedUser.displayName} is active again.` });
      closeModal();
    } catch {
      toast.error('Unable to activate user', { message: 'Try again shortly.' });
    }
  }

  async function handleDelete() {
    if (!selectedUser) {
      return;
    }

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast.success('User deleted', { message: `${selectedUser.displayName} removed from the directory.` });
      closeModal();
    } catch (error) {
      toast.error('Unable to delete user', {
        message: error instanceof Error ? error.message : 'Try again shortly.',
      });
    }
  }

  return (
    <>
      <SettingsSectionCard
        title="User Management"
        description="Admin and staff accounts with role-based access."
        icon={<UsersIcon />}
        actions={
          <PermissionGate permission={PERMISSION.MANAGE_USERS}>
            <Button
              type="button"
              size="sm"
              className="bg-executive-gold text-white hover:opacity-90"
              onClick={() => {
                setSelectedUser(null);
                setModalMode('invite');
              }}
            >
              + Invite User
            </Button>
          </PermissionGate>
        }
      >
        <div className="mb-wilms-4 max-w-xl">
          <Input
            aria-label="Search users"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {isLoading || !users ? (
          <LoadingSpinner label="Loading users" className="py-wilms-4" />
        ) : (
          <DataTable
            variant="executive"
            layout="auto"
            caption="System users"
            data={filteredUsers}
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'user',
                header: 'User',
                className: cn(TABLE_CELL, 'min-w-[16rem]'),
                cell: (row) => (
                  <div className="flex items-center gap-wilms-3">
                    <Avatar
                      label={row.displayName}
                      photoUrl={resolveEntityPhotoUrl({
                        name: row.displayName,
                        id: row.id,
                        photoUrl: row.photoUrl,
                      })}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="max-w-[14rem] truncate font-semibold text-text-primary">
                        {row.displayName}
                        {row.isCurrentUser ? ' (You)' : ''}
                      </p>
                      <p className="max-w-[14rem] truncate text-small text-text-muted">{row.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                id: 'role',
                header: 'Role',
                className: cn(TABLE_CELL, 'min-w-[8rem]'),
                cell: (row) => (
                  <span className={cn('font-semibold', ROLE_TONE_CLASS[row.roleTone])}>{row.roleLabel}</span>
                ),
              },
              {
                id: 'lastLogin',
                header: 'Last Login',
                className: cn(TABLE_CELL, 'min-w-[9rem]'),
                cell: (row) => row.lastLoginLabel,
              },
              {
                id: 'status',
                header: 'Status',
                className: cn(TABLE_CELL, 'min-w-[8rem]'),
                cell: (row) => (
                  <span
                    className={cn(
                      'inline-flex items-center gap-wilms-2 font-semibold',
                      row.status === 'ACTIVE' ? 'text-status-active' : 'text-text-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        row.status === 'ACTIVE' ? 'bg-status-active' : 'bg-text-muted',
                      )}
                      aria-hidden="true"
                    />
                    {formatSettingsUserStatus(row.status, row.statusLabel)}
                  </span>
                ),
              },
              {
                id: 'action',
                header: 'Actions',
                className: cn(TABLE_CELL, 'min-w-[12rem]'),
                cell: (row) => (
                  <div className="flex items-center gap-wilms-3">
                    <button
                      type="button"
                      className="whitespace-nowrap text-small font-semibold text-brand-primary hover:underline"
                      onClick={() => setProfileUserId(row.id)}
                    >
                      View profile
                    </button>
                    {row.status === 'INVITED' ? (
                      <PermissionGate permission={PERMISSION.MANAGE_USERS}>
                        <button
                          type="button"
                          className="whitespace-nowrap text-small font-semibold text-brand-primary hover:underline disabled:opacity-50"
                          disabled={resendInvitation.isPending}
                          onClick={() => void handleResendInvitation(row)}
                        >
                          Resend invite
                        </button>
                      </PermissionGate>
                    ) : null}
                    <button
                      type="button"
                      className="whitespace-nowrap text-small font-semibold text-executive-gold hover:underline"
                      onClick={() => {
                        setSelectedUser(row);
                        setModalMode('edit');
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SettingsSectionCard>

      <SettingsUserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />

      <SettingsUserModal
        isOpen={modalMode !== null}
        mode={modalMode === 'invite' ? 'invite' : 'edit'}
        user={selectedUser}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={modalMode === 'invite' ? handleInvite : handleEdit}
        onDisable={handleDisable}
        onActivate={handleActivate}
        onDelete={handleDelete}
      />
    </>
  );
}
