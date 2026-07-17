'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PERMISSION } from '@/constants/permissions';
import { useSettingsPermissions } from '@/features/settings/hooks/useSettingsRoles';
import { useToast } from '@/hooks/useToast';
import { settingsService } from '@/services';
import type { PermissionDefinition } from '@/types/user-management';
import { useMemo, useState } from 'react';

function permissionOverridesKey(userId: string) {
  return ['settings', 'users', userId, 'permission-overrides'] as const;
}

export function SettingsUserPermissionOverrides({ userId }: { userId: string }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: permissions = [], isLoading: permissionsLoading } = useSettingsPermissions();
  const { data: overrides = [], isLoading: overridesLoading } = useQuery({
    queryKey: permissionOverridesKey(userId),
    queryFn: () => settingsService.listUserPermissionOverrides(userId),
  });

  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [grantMode, setGrantMode] = useState<'grant' | 'revoke'>('grant');

  const availablePermissions = useMemo(
    () =>
      permissions.filter(
        (permission) => !overrides.some((override) => override.permissionId === permission.id),
      ),
    [overrides, permissions],
  );

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
    onError: () => toast.error('Unable to save permission override'),
  });

  const removeOverride = useMutation({
    mutationFn: (permissionId: string) =>
      settingsService.deleteUserPermissionOverride(userId, permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionOverridesKey(userId) });
      toast.success('Permission override removed');
    },
    onError: () => toast.error('Unable to remove permission override'),
  });

  if (permissionsLoading || overridesLoading) {
    return <InlinePanelSkeleton />;
  }

  return (
    <PermissionGate permission={PERMISSION.ASSIGN_PERMISSIONS}>
      <section className="mt-wilms-5 space-y-wilms-3 rounded-sm border border-border bg-background p-wilms-4">
        <div>
          <h3 className="text-small font-semibold uppercase tracking-wide text-executive-gold">
            Individual Permission Overrides
          </h3>
          <p className="mt-wilms-1 text-small text-text-muted">
            Grant or revoke permissions for this user without changing their base role.
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
            >
              <option value="">Select permission</option>
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
              <option value="grant">Grant</option>
              <option value="revoke">Revoke</option>
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
      </section>
    </PermissionGate>
  );
}
