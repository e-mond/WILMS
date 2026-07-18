'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { PermissionCatalogPanel } from '@/features/settings/components/PermissionCatalogPanel';
import { useSettingsPermissions, useSettingsRoles } from '@/features/settings/hooks/useSettingsRoles';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { settingsService } from '@/services';
import { useToast } from '@/hooks/useToast';
import {
  SettingsPermissionsIcon,
  SettingsRolesIcon,
} from '@/features/settings/components/SettingsSectionIcons';
import type { RoleDefinition } from '@/types/user-management';
import { cn } from '@/utils/cn';

const TABLE_CELL = 'whitespace-nowrap align-middle';

export function SettingsRolesSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useSettingsRoles();
  const { data: permissions, isLoading: permissionsLoading } = useSettingsPermissions();

  const cloneRole = useMutation({
    mutationFn: (id: string) => settingsService.cloneRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] });
      toast.success('Role cloned');
    },
    onError: () => toast.error('Unable to clone role'),
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => settingsService.deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] });
      toast.success('Role deleted');
    },
    onError: () => toast.error('Unable to delete role'),
  });

  function handleDeleteRole(role: RoleDefinition) {
    if (role.isSystem) {
      return;
    }

    const confirmed = window.confirm(`Delete role "${role.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    deleteRole.mutate(role.id);
  }

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="space-y-wilms-5">
        <TableSkeleton rows={5} columns={5} />
        <TableSkeleton rows={4} columns={3} />
      </div>
    );
  }

  return (
    <div className="space-y-wilms-5">
      <SettingsSectionCard
        title="Roles & Permissions"
        description="Create, edit, clone, and assign permissions to staff roles."
        icon={<SettingsRolesIcon />}
      >
        <DataTable<RoleDefinition>
          variant="executive"
          layout="auto"
          caption="Role definitions"
          data={roles ?? []}
          getRowId={(row) => row.id}
          columns={[
            {
              id: 'name',
              header: 'Role',
              className: cn(TABLE_CELL, 'min-w-[10rem]'),
              cell: (row) => (
                <div>
                  <p className="font-semibold text-text-primary">{row.name}</p>
                  {row.isSystem ? (
                    <p className="text-small text-text-muted">System role</p>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'description',
              header: 'Description',
              className: 'min-w-[14rem] max-w-[24rem] align-middle',
              cell: (row) => (
                <p className="line-clamp-2 text-small leading-relaxed text-text-muted">{row.description}</p>
              ),
            },
            {
              id: 'permissions',
              header: 'Permissions',
              className: cn(TABLE_CELL, 'min-w-[8rem]'),
              cell: (row) => (
                <span className="inline-flex rounded-sm border border-border bg-background px-wilms-2 py-wilms-1 text-small font-semibold text-text-primary">
                  {row.permissionIds.length} assigned
                </span>
              ),
            },
            {
              id: 'users',
              header: 'Users',
              className: cn(TABLE_CELL, 'min-w-[5rem]'),
              cell: (row) => <span className="font-semibold">{row.userCount}</span>,
            },
            {
              id: 'actions',
              header: 'Actions',
              className: cn(TABLE_CELL, 'min-w-[10rem]'),
              cell: (row) => (
                <div className="flex items-center gap-wilms-2">
                  <PermissionGate permission={PERMISSION.MANAGE_ROLES}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => cloneRole.mutate(row.id)}
                    >
                      Clone
                    </Button>
                    {!row.isSystem ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRole(row)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </PermissionGate>
                </div>
              ),
            },
          ]}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Permission Catalog"
        description="Human-readable permissions for administrators. Technical keys are secondary metadata."
        icon={<SettingsPermissionsIcon />}
      >
        <PermissionCatalogPanel permissions={permissions ?? []} roles={roles ?? []} />
      </SettingsSectionCard>
    </div>
  );
}
