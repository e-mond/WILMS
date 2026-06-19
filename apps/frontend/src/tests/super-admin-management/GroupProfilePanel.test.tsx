import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import groupServiceMock, { resetGroupDetailCache } from '@/services/mock/groupService.mock';
import groupFormationServiceMock from '@/services/mock/groupFormationService.mock';
import { resetGroupsDemoDataset } from '@/services/mock/factories/groups-demo.factory';
import { resetSyntheticBorrowerProfiles } from '@/services/mock/group-members.resolver';
import { PermissionProvider } from '@/components/providers/PermissionProvider';
import { USER_ROLE } from '@/constants/roles';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockGetGroup = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-super-admin', role: USER_ROLE.SUPER_ADMIN, displayName: 'Test Admin' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
    clearSession: vi.fn(),
  }),
}));

vi.mock('@/hooks/useShellAsideContent', () => ({
  useShellAsideContent: () => undefined,
}));

vi.mock('@/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services')>();

  return {
    ...actual,
    groupService: {
      ...actual.groupService,
      getGroup: mockGetGroup,
      flagGroup: vi.fn(),
      updateDisplayName: vi.fn(),
    },
    groupFormationService: groupFormationServiceMock,
  };
});

import { GroupProfilePanel } from '@/features/group-management/components/GroupProfilePanel';

describe('GroupProfilePanel', () => {
  beforeEach(() => {
    resetGroupsDemoDataset();
    resetGroupDetailCache();
    resetSyntheticBorrowerProfiles();
    mockGetGroup.mockReset();
    mockGetGroup.mockImplementation((id: string) => groupServiceMock.getGroup(id));
  });

  it('renders full group detail sections with leader, members, and risk history', async () => {
    render(
      <TestQueryProvider>
        <PermissionProvider>
          <GroupProfilePanel groupId="GRP-0041" />
        </PermissionProvider>
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Adwoa Nhyira Group' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Group Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Community Formation Queue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Group Leader Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assigned Collector Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Group Members' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Membership Management' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Risk History' })).toBeInTheDocument();
    expect(screen.getAllByText('Adwoa Nhyira').length).toBeGreaterThan(0);
    expect(screen.getByText('Esi Ofori')).toBeInTheDocument();
    expect(screen.getByText(/Collection rate dropped below 85%/)).toBeInTheDocument();
  });
});
