'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  ariaLabel = 'Pagination',
}: PaginationProps) {
  const safePageCount = Math.max(pageCount, 1);
  const currentPage = Math.min(Math.max(page, 1), safePageCount);

  return (
    <nav aria-label={ariaLabel} className={cn('flex items-center gap-wilms-3', className)}>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      <p className="text-small text-text-muted">
        Page <span className="font-semibold text-text-primary">{currentPage}</span> of{' '}
        <span className="font-semibold text-text-primary">{safePageCount}</span>
      </p>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= safePageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
