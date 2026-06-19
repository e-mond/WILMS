'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { useSettingsPermissions, useSettingsRoles } from '@/features/settings/hooks/useSettingsRoles';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { settingsService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { RoleDefinition } from '@/types/user-management';

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
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => settingsService.deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] });
      toast.success('Role deleted');
    },
    onError: () => toast.error('Unable to delete role'),
  });

  if (rolesLoading || permissionsLoading) {
    return <LoadingSpinner label="Loading roles and permissions" className="py-wilms-6" />;
  }

  return (
    <div className="space-y-wilms-4">
      <SettingsSectionCard
        title="Roles & Permissions"
        description="Create, edit, clone, and assign permissions to staff roles."
        icon={<span aria-hidden="true">🛡️</span>}
      >
        <DataTable<RoleDefinition>
          caption="Role definitions"
          data={roles ?? []}
          getRowId={(row) => row.id}
          columns={[
            { id: 'name', header: 'Role', cell: (row) => row.name },
            { id: 'description', header: 'Description', cell: (row) => row.description },
            {
              id: 'permissions',
              header: 'Permissions',
              cell: (row) => `${row.permissionIds.length} assigned`,
            },
            { id: 'users', header: 'Users', cell: (row) => row.userCount },
            {
              id: 'actions',
              header: 'Actions',
              cell: (row) => (
                <div className="flex flex-wrap gap-wilms-2">
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
                        onClick={() => deleteRole.mutate(row.id)}
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
        description="Backend-ready permission identifiers grouped by category."
        icon={<span aria-hidden="true">🔐</span>}
      >
        <ul className="grid gap-wilms-3 md:grid-cols-2">
          {(permissions ?? []).map((permission) => (
            <li key={permission.id} className="rounded-sm border border-border bg-background p-wilms-3">
              <p className="font-semibold text-text-primary">{permission.label}</p>
              <p className="text-small text-text-muted">{permission.description}</p>
              <p className="mt-wilms-1 text-[11px] font-semibold uppercase tracking-wide text-executive-gold">
                {permission.category}
              </p>
            </li>
          ))}
        </ul>
      </SettingsSectionCard>
    </div>
  );
}
