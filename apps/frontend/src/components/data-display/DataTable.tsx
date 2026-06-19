import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  caption?: string;
  emptyMessage?: string;
  getRowId: (row: T) => string;
  getRowAriaLabel?: (row: T) => string;
  selectedRowId?: string | null;
  onRowClick?: (row: T) => void;
  variant?: 'default' | 'executive';
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  caption,
  emptyMessage = 'No records found.',
  getRowId,
  selectedRowId,
  onRowClick,
  variant = 'default',
  className,
}: DataTableProps<T>) {
  const isExecutive = variant === 'executive';

  const scrollLabel = caption ?? 'Scrollable table';

  return (
    <div
      role="region"
      aria-label={scrollLabel}
      tabIndex={0}
      className={cn('overflow-x-auto rounded-sm border border-border bg-card', className)}
    >
      <table className="min-w-full border-collapse text-left text-body">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead
          className={cn(
            'border-b border-border',
            isExecutive ? 'bg-card' : 'bg-background',
          )}
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  'px-wilms-4 py-wilms-3 text-small font-semibold uppercase tracking-wide text-text-muted',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-wilms-4 py-wilms-6 text-center text-body text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedRowId === rowId;

              const handleRowActivate = onRowClick
                ? (event: MouseEvent<HTMLTableRowElement>) => {
                    const target = event.target as HTMLElement;

                    if (target.closest('a, button, input, select, textarea, [role="button"]')) {
                      return;
                    }

                    onRowClick(row);
                  }
                : undefined;

              return (
                <tr
                  key={rowId}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    isExecutive && 'transition-colors hover:bg-background',
                    isSelected && 'bg-brand-primary-light',
                    isSelected &&
                      isExecutive &&
                      'border-l-2 border-l-brand-primary shadow-[inset_0_0_0_1px_rgba(212,175,55,0.15)]',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={handleRowActivate}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn('px-wilms-4 py-wilms-3 text-text-primary', column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
