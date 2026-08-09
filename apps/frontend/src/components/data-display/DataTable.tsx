import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** When true, cell content may wrap. Default for executive tables is nowrap. */
  allowWrap?: boolean;
  /** Shown as the label in mobile stacked cards. Falls back to header text when string. */
  mobileLabel?: string;
  /** Higher priority columns appear first / more prominently in stacked mobile layout. */
  priority?: 'primary' | 'secondary' | 'meta';
  /** Hide this column in stacked mobile cards (still shown on desktop table). */
  hideOnMobileStack?: boolean;
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
  /** `fixed` fits columns to container; `auto` sizes columns from content (better for settings tables). */
  layout?: 'fixed' | 'auto';
  /**
   * `scroll` (default): horizontal scroll on small screens.
   * `stack`: below `md`, render compact stacked cards instead of a wide table.
   */
  mobileLayout?: 'scroll' | 'stack';
  className?: string;
}

function columnMobileLabel<T>(column: DataTableColumn<T>): string {
  if (column.mobileLabel) return column.mobileLabel;
  if (typeof column.header === 'string' || typeof column.header === 'number') {
    return String(column.header);
  }
  return column.id;
}

function EmptyState({ emptyMessage }: { emptyMessage: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-wilms-2 px-wilms-4 py-wilms-10 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border bg-background"
        aria-hidden="true"
      >
        <span className="text-heading-2 text-text-muted">∅</span>
      </div>
      <p className="font-medium text-text-primary">{emptyMessage}</p>
      <p className="text-small text-text-muted">
        Adjust filters or check back after new records are created.
      </p>
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  caption,
  emptyMessage = 'No records found.',
  getRowId,
  getRowAriaLabel,
  selectedRowId,
  onRowClick,
  variant = 'default',
  layout,
  mobileLayout = 'scroll',
  className,
}: DataTableProps<T>) {
  const isExecutive = variant === 'executive';
  // Auto layout prevents identity/name cells from crushing under table-fixed.
  // Horizontal overflow is handled by the scroll region wrapper.
  const tableLayout = layout ?? 'auto';
  const useStack = mobileLayout === 'stack';

  const scrollLabel = caption ?? 'Scrollable table';
  const stackColumns = columns.filter((column) => !column.hideOnMobileStack);

  const activateRow = (row: T) => {
    onRowClick?.(row);
  };

  const handleInteractiveActivate = (row: T) => (event: MouseEvent | KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, select, textarea, [role="button"]')) {
      return;
    }
    if ('key' in event && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if ('key' in event) {
      event.preventDefault();
    }
    activateRow(row);
  };

  return (
    <div className={cn(useStack ? className : undefined)}>
      {useStack ? (
        <div className="space-y-wilms-3 md:hidden" role="list" aria-label={caption ?? 'Records'}>
          {data.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState emptyMessage={emptyMessage} />
            </div>
          ) : (
            data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedRowId === rowId;
              const primary = stackColumns.find((c) => c.priority === 'primary') ?? stackColumns[0];
              const rest = stackColumns.filter((c) => c.id !== primary?.id);
              const ariaLabel = getRowAriaLabel?.(row);

              return (
                <div
                  key={rowId}
                  role="listitem"
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={ariaLabel}
                  className={cn(
                    'rounded-xl border border-border/80 bg-card p-wilms-4 shadow-[var(--shadow-card)]',
                    isSelected && 'border-brand-primary bg-brand-primary-light/40',
                    onRowClick && 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)]',
                  )}
                  onClick={onRowClick ? handleInteractiveActivate(row) : undefined}
                  onKeyDown={onRowClick ? handleInteractiveActivate(row) : undefined}
                >
                  {primary ? (
                    <div className="flex items-start justify-between gap-wilms-3">
                      <div className="min-w-0 flex-1 text-body font-semibold text-text-primary">
                        {primary.cell(row)}
                      </div>
                    </div>
                  ) : null}
                  {rest.length > 0 ? (
                    <dl className="mt-wilms-3 grid grid-cols-2 gap-x-wilms-3 gap-y-wilms-2">
                      {rest.map((column) => (
                        <div
                          key={column.id}
                          className={cn(
                            'min-w-0',
                            column.priority === 'meta' && 'col-span-2 sm:col-span-1',
                          )}
                        >
                          <dt className="text-small font-medium uppercase tracking-wide text-text-muted">
                            {columnMobileLabel(column)}
                          </dt>
                          <dd className="mt-0.5 text-body text-text-primary">{column.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}

      <div
        role="region"
        aria-label={scrollLabel}
        tabIndex={0}
        className={cn(
          'overflow-x-auto rounded-xl border border-border/80 bg-card shadow-[var(--shadow-card)]',
          useStack && 'hidden md:block',
          !useStack && className,
        )}
      >
        <table
          className={cn(
            'min-w-full border-collapse text-left text-body',
            tableLayout === 'fixed' && 'table-fixed',
            tableLayout === 'auto' && 'w-max min-w-full table-auto',
          )}
        >
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead
            className={cn(
              'sticky top-0 z-10 border-b border-border shadow-[0_1px_0_0_var(--color-border)]',
              isExecutive ? 'bg-card/95 backdrop-blur-sm' : 'bg-background/95 backdrop-blur-sm',
            )}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    'px-wilms-4 text-small font-semibold uppercase tracking-wide text-text-muted',
                    'py-[var(--density-table-cell-y)]',
                    isExecutive && !column.allowWrap && 'whitespace-nowrap',
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
                <td colSpan={columns.length}>
                  <EmptyState emptyMessage={emptyMessage} />
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
                      'border-b border-border/70 last:border-b-0',
                      'transition-colors duration-[var(--motion-fast)] hover:bg-background/80',
                      isSelected && 'bg-brand-primary-light',
                      isSelected &&
                        isExecutive &&
                        'border-l-2 border-l-brand-primary shadow-[inset_0_0_0_1px_rgba(15,110,86,0.12)]',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={handleRowActivate}
                    aria-label={getRowAriaLabel?.(row)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-wilms-4 py-[var(--density-table-cell-y)] text-text-primary',
                          isExecutive && !column.allowWrap && 'whitespace-nowrap',
                          column.className,
                        )}
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
    </div>
  );
}
