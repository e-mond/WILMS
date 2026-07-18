'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PERMISSION } from '@/constants/permissions';
import { useSettingsPermissions } from '@/features/settings/hooks/useSettingsRoles';
import { useToast } from '@/hooks/useToast';
import { presentUserFacingError } from '@/lib/errors/user-friendly-error';
import { settingsService } from '@/services';
import type { PermissionDefinition } from '@/types/user-management';
import { useEffect, useMemo, useState } from 'react';

function permissionOverridesKey(userId: string) {
  return ['settings', 'users', userId, 'permission-overrides'] as const;
}

export interface SettingsUserPermissionOverridesProps {
  userId: string;
  /** Role-default permission ids for this user (from profile). */
  rolePermissionIds: string[];
  roleLabel?: string;
}

export function SettingsUserPermissionOverrides({
  userId,
  rolePermissionIds,
  roleLabel,
}: SettingsUserPermissionOverridesProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: permissions = [], isLoading: permissionsLoading } = useSettingsPermissions();
  const { data: overrides = [], isLoading: overridesLoading } = useQuery({
    queryKey: permissionOverridesKey(userId),
    queryFn: () => settingsService.listUserPermissionOverrides(userId),
  });

  const rolePermissionSet = useMemo(() => new Set(rolePermissionIds), [rolePermissionIds]);
  const defaultMode: 'grant' | 'revoke' =
    rolePermissionIds.length > 0 &&
    permissions.length > 0 &&
    permissions.every((permission) => rolePermissionSet.has(permission.id))
      ? 'revoke'
      : 'grant';

  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [grantMode, setGrantMode] = useState<'grant' | 'revoke'>(defaultMode);

  useEffect(() => {
    setGrantMode(defaultMode);
    setSelectedPermissionId('');
  }, [defaultMode, userId]);

  const availablePermissions = useMemo(() => {
    const notAlreadyOverridden = (permission: PermissionDefinition) =>
      !overrides.some((override) => override.permissionId === permission.id);

    if (grantMode === 'grant') {
      return permissions.filter(
        (permission) => notAlreadyOverridden(permission) && !rolePermissionSet.has(permission.id),
      );
    }

    return permissions.filter(
      (permission) => notAlreadyOverridden(permission) && rolePermissionSet.has(permission.id),
    );
  }, [grantMode, overrides, permissions, rolePermissionSet]);

  useEffect(() => {
    if (
      selectedPermissionId &&
      !availablePermissions.some((permission) => permission.id === selectedPermissionId)
    ) {
      setSelectedPermissionId('');
    }
  }, [availablePermissions, selectedPermissionId]);

  const saveOverride = useMutation({
    mutationFn: () =>
      settingsService.upsertUserPermissionOverrides(userId, [
        {
          permissionId: selectedPermissionId,
          granted: grantMode === 'grant',
        },
      ]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionOverridesKey(userId) });
      setSelectedPermissionId('');
      toast.success('Permission override saved');
    },
    onError: (error) =>
      toast.error('Unable to save permission override', {
        message: presentUserFacingError(
          error,
          'Choose a permission that matches Grant or Revoke for this role.',
        ),
      }),
  });

  const removeOverride = useMutation({
    mutationFn: (permissionId: string) =>
      settingsService.deleteUserPermissionOverride(userId, permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionOverridesKey(userId) });
      toast.success('Permission override removed');
    },
    onError: (error) =>
      toast.error('Unable to remove permission override', {
        message: presentUserFacingError(error, 'Try again shortly.'),
      }),
  });

  if (permissionsLoading || overridesLoading) {
    return <InlinePanelSkeleton />;
  }

  const emptyHint =
    grantMode === 'grant'
      ? roleLabel
        ? `${roleLabel} already includes every available permission. Switch to Revoke to remove access for this user.`
        : 'This role already includes every available permission. Switch to Revoke to remove access for this user.'
      : 'No role permissions left to revoke. Switch to Grant to add access outside the role.';

  return (
    <PermissionGate permission={PERMISSION.ASSIGN_PERMISSIONS}>
      <section className="mt-wilms-5 space-y-wilms-3 rounded-sm border border-border bg-background p-wilms-4">
        <div>
          <h3 className="text-small font-semibold uppercase tracking-wide text-executive-gold">
            Individual Permission Overrides
          </h3>
          <p className="mt-wilms-1 text-small text-text-muted">
            Grant permissions outside the role, or revoke a role permission for this user only.
            Changes do not edit the role itself.
          </p>
        </div>

        <ul className="space-y-wilms-2">
          {overrides.length === 0 ? (
            <li className="text-small text-text-muted">No overrides assigned.</li>
          ) : (
            overrides.map((override) => (
              <li
                key={`${override.permissionId}-${override.granted}`}
                className="flex items-center justify-between gap-wilms-2 rounded-sm border border-border px-wilms-3 py-wilms-2"
              >
                <div>
                  <p className="font-semibold text-text-primary">{override.permissionId}</p>
                  <p className="text-small text-text-muted">
                    {override.granted ? 'Granted' : 'Revoked'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeOverride.mutate(override.permissionId)}
                >
                  Remove
                </Button>
              </li>
            ))
          )}
        </ul>

        <div className="grid gap-wilms-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="block space-y-wilms-1 text-small">
            <span className="font-semibold text-text-primary">Permission</span>
            <Select
              value={selectedPermissionId}
              onChange={(event) => setSelectedPermissionId(event.target.value)}
              disabled={availablePermissions.length === 0}
            >
              <option value="">
                {availablePermissions.length === 0 ? 'No matching permissions' : 'Select permission'}
              </option>
              {availablePermissions.map((permission: PermissionDefinition) => (
                <option key={permission.id} value={permission.id}>
                  {permission.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-wilms-1 text-small">
            <span className="font-semibold text-text-primary">Action</span>
            <Select
              value={grantMode}
              onChange={(event) => setGrantMode(event.target.value as 'grant' | 'revoke')}
            >
              <option value="grant">Grant (add outside role)</option>
              <option value="revoke">Revoke (remove from role)</option>
            </Select>
          </label>
          <Button
            type="button"
            disabled={!selectedPermissionId || saveOverride.isPending}
            onClick={() => saveOverride.mutate()}
          >
            Apply Override
          </Button>
        </div>

        {availablePermissions.length === 0 ? (
          <p className="text-small text-text-muted" role="status">
            {emptyHint}
          </p>
        ) : null}
      </section>
    </PermissionGate>
  );
}
