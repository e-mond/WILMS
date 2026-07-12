import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import borrowerServiceMock, { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListBorrowers = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/services', () => ({
  borrowerService: {
    listBorrowers: mockListBorrowers,
  },
}));

import { BorrowerList } from '@/features/borrower-management/components/BorrowerList';

describe('BorrowerList', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    mockListBorrowers.mockReset();
    mockReplace.mockReset();
    mockListBorrowers.mockImplementation(() => borrowerServiceMock.listBorrowers());
  });

  it('renders borrowers with profile links', async () => {
    render(
      <TestQueryProvider>
        <BorrowerList />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Ama Mensah')).toBeInTheDocument();
    const profileLinks = screen.getAllByRole('link', { name: 'View profile' });
    expect(profileLinks.some((link) => link.getAttribute('href') === '/borrowers/borrower-001')).toBe(
      true,
    );
  });

  it('filters borrowers by status', async () => {
    const user = userEvent.setup();
    render(
      <TestQueryProvider>
        <BorrowerList />
      </TestQueryProvider>,
    );

    await screen.findByText('Ama Mensah');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter borrowers by status' }), 'APPROVED');

    expect(screen.getByText('Ama Mensah')).toBeInTheDocument();
    expect(screen.queryByText('Adjoa Owusu')).not.toBeInTheDocument();
  });
});
