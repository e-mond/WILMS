import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination', () => {
  it('navigates pages', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        page={2}
        pageCount={4}
        onPageChange={onPageChange}
        ariaLabel="Results pages"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
