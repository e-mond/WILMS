'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export interface RoleWorkspaceQuickAction {
  href: string;
  label: string;
  description: string;
}

export interface RoleWorkspaceMetric {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'warning' | 'success' | 'danger';
  href?: string;
}

interface RoleWorkspaceHeroProps {
  title: string;
  subtitle: string;
  metrics?: RoleWorkspaceMetric[];
  actions?: RoleWorkspaceQuickAction[];
  children?: ReactNode;
  className?: string;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function metricToneClass(tone: RoleWorkspaceMetric['tone']): string {
  switch (tone) {
    case 'warning':
      return 'text-warning';
    case 'success':
      return 'text-status-active';
    case 'danger':
      return 'text-danger';
    default:
      return 'text-text-primary';
  }
}

export function RoleWorkspaceHero({
  title,
  subtitle,
  metrics = [],
  actions = [],
  children,
  className,
}: RoleWorkspaceHeroProps) {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(/\s+/)[0] ?? 'there';
  const greeting = greetingForHour(new Date().getHours());

  return (
    <section className={cn('space-y-wilms-4', className)} aria-label={title}>
      <Card>
        <CardHeader className="gap-wilms-2 p-wilms-5 pb-wilms-3">
          <p className="text-small font-medium text-text-muted">
            {greeting}, {firstName}
          </p>
          <CardTitle className="text-heading-2 tracking-tight">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
          {user?.role ? (
            <div className="pt-wilms-1">
              <span className="rounded-full border border-border/70 bg-background/70 px-wilms-2 py-0.5 text-xs font-semibold text-text-muted">
                {user.role.replaceAll('_', ' ')}
              </span>
            </div>
          ) : null}
        </CardHeader>
        {metrics.length > 0 ? (
          <CardContent className="grid gap-wilms-3 pt-0 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const body = (
                <>
                  <p className="text-small text-text-muted">{metric.label}</p>
                  <p className={cn('mt-wilms-1 text-heading-3 font-semibold', metricToneClass(metric.tone))}>
                    {metric.value}
                  </p>
                </>
              );

              if (metric.href) {
                return (
                  <Link
                    key={metric.label}
                    href={metric.href}
                    className="rounded-xl border border-border/60 bg-background/50 px-wilms-3 py-wilms-3 transition-colors hover:border-brand-primary/40 hover:bg-brand-primary-light/20"
                  >
                    {body}
                  </Link>
                );
              }

              return (
                <div
                  key={metric.label}
                  className="rounded-xl border border-border/60 bg-background/50 px-wilms-3 py-wilms-3"
                >
                  {body}
                </div>
              );
            })}
          </CardContent>
        ) : null}
      </Card>

      {actions.length > 0 ? (
        <div className="grid gap-wilms-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl border border-border/70 bg-[var(--glass-surface)] px-wilms-4 py-wilms-3 shadow-[var(--shadow-card)] backdrop-blur-[var(--glass-blur)] transition-colors hover:border-brand-primary/40"
            >
              <p className="text-small font-semibold text-brand-primary">{action.label}</p>
              <p className="mt-wilms-1 text-xs text-text-muted">{action.description}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {children}
    </section>
  );
}
