'use client';

import { useMemo, useState } from 'react';
import { Copy, Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { PermissionDefinition, RoleDefinition } from '@/types/user-management';
import { cn } from '@/utils/cn';

function groupPermissionsByCategory(permissions: PermissionDefinition[]) {
  const groups = new Map<string, PermissionDefinition[]>();
  for (const permission of permissions) {
    const bucket = groups.get(permission.category) ?? [];
    bucket.push(permission);
    groups.set(permission.category, bucket);
  }
  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function rolesUsingPermission(
  permissionId: string,
  roles: RoleDefinition[],
): RoleDefinition[] {
  return roles.filter((role) => role.permissionIds.includes(permissionId));
}

function CopyableKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-left transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard may be unavailable; still show the key in title.
        }
      }}
      title={`Copy permission key: ${value}`}
      aria-label={`Copy permission key ${value}`}
    >
      <code className="truncate font-mono text-[11px] text-text-muted">{value}</code>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-text-tertiary opacity-70 group-hover:opacity-100" aria-hidden="true" />
      )}
    </button>
  );
}

export function PermissionCatalogPanel({
  permissions,
  roles,
}: {
  permissions: PermissionDefinition[];
  roles: RoleDefinition[];
}) {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = normalized
      ? permissions.filter((permission) => {
          const haystack = [
            permission.label,
            permission.description,
            permission.id,
            permission.category,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalized);
        })
      : permissions;

    return groupPermissionsByCategory(source);
  }, [permissions, query]);

  const total = filteredGroups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <div className="space-y-wilms-4">
      <div className="rounded-md border border-border bg-background px-wilms-4 py-wilms-3 text-small text-text-muted">
        <p className="font-semibold text-text-primary">How permissions work</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-text-primary">Roles</strong> carry a default set of permissions
            (Settings → Roles). Changing a role updates every user with that role.
          </li>
          <li>
            <strong className="text-text-primary">User overrides</strong> grant or revoke one
            permission for a single person (Users → open profile → Permission overrides) without
            changing the whole role.
          </li>
          <li>Permissions below are grouped by category. The technical key is secondary metadata.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search permissions by name, category, or key…"
            className="pl-9"
            aria-label="Search permissions"
          />
        </div>
        <p className="text-small text-text-muted">
          {total} permission{total === 1 ? '' : 's'}
          {query.trim() ? ' matching' : ''} in {filteredGroups.length} group
          {filteredGroups.length === 1 ? '' : 's'}
        </p>
      </div>

      {total === 0 ? (
        <div className="rounded-md border border-dashed border-border px-wilms-4 py-wilms-8 text-center">
          <p className="font-medium text-text-primary">No permissions match</p>
          <p className="mt-1 text-small text-text-muted">
            Try a different name, category, or permission key.
          </p>
        </div>
      ) : (
        <div className="space-y-wilms-5">
          {filteredGroups.map(([category, items]) => (
            <section key={category} aria-labelledby={`permission-cat-${category}`}>
              <div className="mb-2 flex items-center gap-2">
                <h3
                  id={`permission-cat-${category}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary"
                >
                  {category}
                </h3>
                <Badge variant="default" className="text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
                {items.map((permission) => {
                  const usedBy = rolesUsingPermission(permission.id, roles);
                  return (
                    <li
                      key={permission.id}
                      className="grid gap-3 px-wilms-4 py-wilms-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-start"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-body font-semibold text-text-primary">
                          {permission.label}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-small leading-relaxed text-text-muted">
                          {permission.description}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                          Permission key
                        </p>
                        <CopyableKey value={permission.id} />
                        {usedBy.length > 0 ? (
                          <p className="text-small text-text-muted">
                            Used by:{' '}
                            <span className="font-medium text-text-primary">
                              {usedBy.map((role) => role.name).join(', ')}
                            </span>
                          </p>
                        ) : (
                          <p className="text-small text-text-tertiary">Not assigned to any role</p>
                        )}
                      </div>
                      <div className="md:justify-self-end">
                        <span
                          className={cn(
                            'inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium',
                            'border-border bg-background text-text-muted',
                          )}
                        >
                          {category}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
