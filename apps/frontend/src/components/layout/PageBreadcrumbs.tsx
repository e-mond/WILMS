import Link from 'next/link';

export interface PageBreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}

export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-small text-text-muted">
      <ol className="flex flex-wrap items-center gap-wilms-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-wilms-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="font-semibold hover:text-brand-primary">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-text-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
