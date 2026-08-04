import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@wilms/shared-rbac';
import { AppError } from '../../http/errors.js';
import { assertCollectorAccess } from '../../modules/collector-portal/access.js';

const COLLECTOR_ID = 'collector-user-1';
const OTHER_COLLECTOR_ID = 'collector-user-2';

describe('assertCollectorAccess', () => {
  it('allows collectors to access their own dashboard', () => {
    expect(() =>
      assertCollectorAccess(
        {
          userId: COLLECTOR_ID,
          role: USER_ROLE.COLLECTOR,
          expiresAt: Date.now() + 60_000,
        },
        COLLECTOR_ID,
      ),
    ).not.toThrow();
  });

  it('blocks collectors from accessing another collector dashboard', () => {
    expect(() =>
      assertCollectorAccess(
        {
          userId: COLLECTOR_ID,
          role: USER_ROLE.COLLECTOR,
          expiresAt: Date.now() + 60_000,
        },
        OTHER_COLLECTOR_ID,
      ),
    ).toThrow(AppError);
  });

  it('allows super admins to access any collector dashboard', () => {
    expect(() =>
      assertCollectorAccess(
        {
          userId: 'admin-user',
          role: USER_ROLE.SUPER_ADMIN,
          expiresAt: Date.now() + 60_000,
        },
        OTHER_COLLECTOR_ID,
      ),
    ).not.toThrow();
  });

  it('blocks registration officers from collector dashboards', () => {
    expect(() =>
      assertCollectorAccess(
        {
          userId: 'officer-user',
          role: USER_ROLE.REGISTRATION_OFFICER,
          expiresAt: Date.now() + 60_000,
        },
        COLLECTOR_ID,
      ),
    ).toThrow(AppError);
  });
});
