import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PageBreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
  className?: string;
  /** When true, collapse middle crumbs on narrow viewports (keeps first + last). */
  collapseOnNarrow?: boolean;
}

function CrumbSeparator() {
  return <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-tertiary" aria-hidden="true" />;
}

export function PageBreadcrumbs({
  items,
  className,
  collapseOnNarrow = true,
}: PageBreadcrumbsProps) {
  if (!items.length) {
    return null;
  }

  const lastIndex = items.length - 1;
  const shouldCollapse = collapseOnNarrow && items.length > 2;
  const first = items[0]!;
  const last = items[lastIndex]!;
  const middle = items.slice(1, lastIndex);

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0 text-small text-text-muted', className)}>
      <ol className="flex min-w-0 items-center gap-1.5">
        <li className="flex min-w-0 items-center gap-1.5">
          {first.href && lastIndex > 0 ? (
            <Link
              href={first.href}
              className="truncate font-medium text-text-muted transition-colors hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              {first.label}
            </Link>
          ) : (
            <span
              aria-current={lastIndex === 0 ? 'page' : undefined}
              className={cn(
                'truncate font-semibold',
                lastIndex === 0 ? 'text-text-primary' : 'text-text-muted',
              )}
            >
              {first.label}
            </span>
          )}
        </li>

        {shouldCollapse ? (
          <li className="flex items-center gap-1.5 lg:hidden" aria-hidden="true">
            <CrumbSeparator />
            <span className="text-text-tertiary">…</span>
          </li>
        ) : null}

        {middle.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className={cn('flex min-w-0 items-center gap-1.5', shouldCollapse && 'hidden lg:flex')}
          >
            <CrumbSeparator />
            {item.href ? (
              <Link
                href={item.href}
                className="truncate font-medium text-text-muted transition-colors hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-text-muted">{item.label}</span>
            )}
          </li>
        ))}

        {lastIndex > 0 ? (
          <li className="flex min-w-0 items-center gap-1.5">
            <CrumbSeparator />
            <span aria-current="page" className="truncate font-semibold text-text-primary">
              {last.label}
            </span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
