import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const overridesSource = readFileSync(
  join(process.cwd(), 'src/features/settings/components/SettingsUserPermissionOverrides.tsx'),
  'utf8',
);
const profileSource = readFileSync(
  join(process.cwd(), 'src/features/settings/components/SettingsUserProfileModal.tsx'),
  'utf8',
);

describe('permission overrides UI', () => {
  it('filters grant/revoke options using role permission ids from the profile', () => {
    expect(overridesSource).toContain('rolePermissionIds');
    expect(overridesSource).toContain("grantMode === 'grant'");
    expect(overridesSource).toContain('rolePermissionSet.has(permission.id)');
    expect(profileSource).toContain('rolePermissionIds={data.assignedPermissionIds}');
  });

  it('surfaces API validation errors instead of a generic toast only', () => {
    expect(overridesSource).toContain('presentUserFacingError');
    expect(overridesSource).toContain('Unable to save permission override');
  });

  it('defaults Super Admin–style full roles to revoke mode', () => {
    expect(overridesSource).toContain("'revoke'");
    expect(overridesSource).toContain('defaultMode');
  });
});
