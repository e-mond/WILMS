import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import borrowerServiceMock, {
  resetMockBorrowerRegistrations,
} from '@/services/mock/borrowerService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const push = vi.fn();
const mockListMyRegistrations = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-officer', role: 'REGISTRATION_OFFICER', displayName: 'Registration Officer' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/services', () => ({
  borrowerService: {
    listMyRegistrations: mockListMyRegistrations,
  },
}));

import { MyRegistrationsList } from '@/features/borrower-registration/components/MyRegistrationsList';

function renderList() {
  return render(
    <TestQueryProvider>
      <MyRegistrationsList />
    </TestQueryProvider>,
  );
}

describe('MyRegistrationsList', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    push.mockReset();
    mockListMyRegistrations.mockImplementation((officerId: string) =>
      borrowerServiceMock.listMyRegistrations(officerId),
    );
  });

  it('lists registrations for the signed-in officer', async () => {
    renderList();

    expect(await screen.findByRole('cell', { name: /Adjoa Owusu/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Ama Mensah/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: /Ama Mensan/i })).not.toBeInTheDocument();
  });

  it('filters registrations by search query', async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByRole('cell', { name: /Adjoa Owusu/i });
    await user.type(screen.getByRole('textbox', { name: 'Search registrations' }), 'Adjoa');

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: /Adjoa Owusu/i })).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: /Ama Mensah/i })).not.toBeInTheDocument();
    });
  });

  it('filters registrations by status', async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByRole('cell', { name: /Adjoa Owusu/i });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter registrations by status' }), 'UNDER_REVIEW');

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: /Adjoa Owusu/i })).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: /Ama Mensah/i })).not.toBeInTheDocument();
    });
  });
});
