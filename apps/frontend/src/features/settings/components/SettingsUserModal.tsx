'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { USER_ROLE } from '@/constants/roles';
import type { SettingsUserRecord } from '@/types/settings';

const ROLE_OPTIONS = [
  { value: USER_ROLE.SUPER_ADMIN, label: 'Super Admin' },
  { value: USER_ROLE.APPROVER, label: 'Approver' },
  { value: USER_ROLE.REGISTRATION_OFFICER, label: 'Registration Officer' },
  { value: USER_ROLE.COLLECTOR, label: 'Collector' },
  { value: USER_ROLE.AUDITOR, label: 'Auditor' },
];

export interface SettingsUserFormValues {
  displayName: string;
  email: string;
  role: string;
  phone?: string;
}

export interface SettingsUserModalProps {
  isOpen: boolean;
  mode: 'invite' | 'edit';
  user?: SettingsUserRecord | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: SettingsUserFormValues) => void;
  onDisable?: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
}

export function SettingsUserModal({
  isOpen,
  mode,
  user,
  isSubmitting = false,
  onClose,
  onSubmit,
  onDisable,
  onActivate,
  onDelete,
}: SettingsUserModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>(USER_ROLE.APPROVER);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDisplayName(user?.displayName ?? '');
    setEmail(user?.email ?? '');
    setPhone('');
    setRole(user?.role ?? USER_ROLE.APPROVER);
  }, [isOpen, user]);

  const canDelete = mode === 'edit' && user && !user.isCurrentUser;
  const canSuspend = mode === 'edit' && user && !user.isCurrentUser;
  const isSuspended = user?.status === 'SUSPENDED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'invite' ? 'Invite User' : `Edit ${user?.displayName ?? 'User'}`}
      footer={
        <>
          {mode === 'edit' && user ? (
            <div className="mr-auto flex flex-wrap gap-wilms-2">
              {isSuspended ? (
                <PermissionGate permission={PERMISSION.ACTIVATE_USERS}>
                  <Button type="button" variant="secondary" size="sm" disabled={isSubmitting} onClick={onActivate}>
                    Activate
                  </Button>
                </PermissionGate>
              ) : canSuspend ? (
                <PermissionGate permission={PERMISSION.SUSPEND_USERS}>
                  <Button type="button" variant="secondary" size="sm" disabled={isSubmitting} onClick={onDisable}>
                    Suspend
                  </Button>
                </PermissionGate>
              ) : null}
              {canDelete ? (
                <PermissionGate permission={PERMISSION.MANAGE_USERS}>
                  <Button type="button" variant="danger" size="sm" disabled={isSubmitting} onClick={onDelete}>
                    Delete
                  </Button>
                </PermissionGate>
              ) : null}
            </div>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <PermissionGate
            permission={mode === 'invite' ? PERMISSION.MANAGE_USERS : PERMISSION.EDIT_USERS}
          >
            <Button
              type="button"
              size="sm"
              className="bg-executive-gold text-white hover:opacity-90"
              disabled={isSubmitting || !displayName.trim() || !email.trim()}
              onClick={() =>
                onSubmit({
                  displayName: displayName.trim(),
                  email: email.trim(),
                  role,
                  phone: phone.trim() || undefined,
                })
              }
            >
              {mode === 'invite' ? 'Send Invite' : 'Save Changes'}
            </Button>
          </PermissionGate>
        </>
      }
    >
      <div className="space-y-wilms-4">
        <div>
          <label htmlFor="settings-user-name" className="text-small font-semibold text-text-primary">
            Full name
          </label>
          <Input
            id="settings-user-name"
            className="mt-wilms-2"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ama Boateng"
          />
        </div>
        <div>
          <label htmlFor="settings-user-email" className="text-small font-semibold text-text-primary">
            Email address
          </label>
          <Input
            id="settings-user-email"
            className="mt-wilms-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@wilms.demo"
          />
        </div>
        {mode === 'invite' ? (
          <div>
            <label htmlFor="settings-user-phone" className="text-small font-semibold text-text-primary">
              SMS phone (optional)
            </label>
            <Input
              id="settings-user-phone"
              className="mt-wilms-2"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+233..."
            />
            <p className="mt-wilms-2 text-small text-text-muted">
              If provided, WILMS sends an SMS asking the user to check their email and accept the invitation.
            </p>
          </div>
        ) : null}
        <div>
          <label htmlFor="settings-user-role" className="text-small font-semibold text-text-primary">
            Role
          </label>
          <Select
            id="settings-user-role"
            className="mt-wilms-2"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        {mode === 'edit' && user ? (
          <p className="text-small text-text-muted">
            Status: <span className="font-semibold text-text-primary">{user.status}</span>
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
