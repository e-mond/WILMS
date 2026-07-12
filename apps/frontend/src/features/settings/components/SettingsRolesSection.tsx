'use client';

import { useMemo } from 'react';
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
import {
  SettingsPermissionsIcon,
  SettingsRolesIcon,
} from '@/features/settings/components/SettingsSectionIcons';
import type { PermissionDefinition, RoleDefinition } from '@/types/user-management';
import { cn } from '@/utils/cn';

const TABLE_CELL = 'whitespace-nowrap align-middle';

function groupPermissionsByCategory(permissions: PermissionDefinition[]) {
  const groups = new Map<string, PermissionDefinition[]>();

  for (const permission of permissions) {
    const bucket = groups.get(permission.category) ?? [];
    bucket.push(permission);
    groups.set(permission.category, bucket);
  }

  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}

export function SettingsRolesSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useSettingsRoles();
  const { data: permissions, isLoading: permissionsLoading } = useSettingsPermissions();

  const permissionGroups = useMemo(
    () => groupPermissionsByCategory(permissions ?? []),
    [permissions],
  );

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
        icon={<SettingsPermissionsIcon />}
      >
        <div className="space-y-wilms-5">
          {permissionGroups.map(([category, items]) => (
            <section key={category} className="space-y-wilms-3">
              <h3 className="text-small font-semibold uppercase tracking-wide text-executive-gold">
                {category}
              </h3>
              <ul className="grid gap-wilms-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((permission) => (
                  <li
                    key={permission.id}
                    className="rounded-sm border border-border bg-background p-wilms-4"
                  >
                    <p className="font-semibold text-text-primary">{permission.label}</p>
                    <p className="mt-wilms-1 text-small leading-relaxed text-text-muted">
                      {permission.description}
                    </p>
                    <p className="mt-wilms-2 font-mono text-[11px] text-text-muted">{permission.id}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </SettingsSectionCard>
    </div>
  );
}
