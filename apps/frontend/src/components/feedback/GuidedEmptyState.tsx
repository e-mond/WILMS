import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

export interface GuidedEmptyStateProps {
  title: string;
  description?: string;
  whyEmpty?: string;
  howToStart?: string;
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export function GuidedEmptyState({
  title,
  description,
  whyEmpty,
  howToStart,
  action,
  actionHref,
  actionLabel,
  icon,
  className,
}: GuidedEmptyStateProps) {
  const resolvedAction =
    action ??
    (actionHref && actionLabel ? (
      <Link
        href={actionHref}
        className="inline-flex h-10 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-4 text-body text-card hover:opacity-90"
      >
        {actionLabel}
      </Link>
    ) : null);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-sm border border-border bg-card p-wilms-8 text-center',
        className,
      )}
    >
      {icon ? <div className="mb-wilms-4 text-brand-primary">{icon}</div> : null}
      <h2 className="text-heading-2 font-semibold text-text-primary">{title}</h2>
      {description ? (
        <p className="mt-wilms-2 max-w-md text-body text-text-muted">{description}</p>
      ) : null}
      {(whyEmpty || howToStart) && (
        <div className="mt-wilms-4 w-full max-w-lg space-y-wilms-3 rounded-sm border border-border bg-background px-wilms-4 py-wilms-3 text-left">
          {whyEmpty ? (
            <div>
              <p className="text-small font-semibold text-text-primary">Why is this empty?</p>
              <p className="mt-wilms-1 text-small text-text-muted">{whyEmpty}</p>
            </div>
          ) : null}
          {howToStart ? (
            <div>
              <p className="text-small font-semibold text-text-primary">How to get started</p>
              <p className="mt-wilms-1 text-small text-text-muted">{howToStart}</p>
            </div>
          ) : null}
        </div>
      )}
      {resolvedAction ? <div className="mt-wilms-4">{resolvedAction}</div> : null}
    </div>
  );
}
