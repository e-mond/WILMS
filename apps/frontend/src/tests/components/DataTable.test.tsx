import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from '@/components/data-display/DataTable';

describe('DataTable', () => {
  it('renders column headers and rows', () => {
    render(
      <DataTable
        caption="Borrower registrations"
        getRowId={(row) => row.id}
        data={[
          { id: 'borrower-001', name: 'Ama Mensah', phone: '+233241234567' },
          { id: 'borrower-002', name: 'Efua Boateng', phone: '+233209876543' },
        ]}
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'phone', header: 'Phone', cell: (row) => row.phone },
        ]}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ama Mensah' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '+233209876543' })).toBeInTheDocument();
  });

  it('activates clickable rows on click', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    render(
      <DataTable
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        data={[{ id: 'borrower-001', name: 'Ama Mensah' }]}
        columns={[{ id: 'name', header: 'Name', cell: (row) => row.name }]}
      />,
    );

    await user.click(screen.getByRole('cell', { name: 'Ama Mensah' }));
    expect(onRowClick).toHaveBeenCalledWith({ id: 'borrower-001', name: 'Ama Mensah' });
  });

  it('shows an empty state message when there is no data', () => {
    render(
      <DataTable
        getRowId={(row: { id: string; name: string }) => row.id}
        data={[]}
        emptyMessage="No registrations found."
        columns={[
          { id: 'name', header: 'Name', cell: (row: { id: string; name: string }) => row.name },
        ]}
      />,
    );

    expect(screen.getByText('No registrations found.')).toBeInTheDocument();
  });
});
