'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  FileText,
  Info,
  MessageSquare,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import auditService from '@/services/auditService';
import type { AuditEntry } from '@/types/services';
import { cn } from '@/utils/cn';
import { USER_ROLE } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';

type ActivityCategory =
  | 'financial'
  | 'workflow'
  | 'notification'
  | 'communication'
  | 'security'
  | 'system';

interface ActivityItem {
  id: string;
  message: string;
  createdAt: string;
  category: ActivityCategory;
  href?: string;
  status: 'info' | 'warning' | 'danger' | 'success';
  actor?: string;
}

function classifyAction(action: string): { category: ActivityCategory; status: ActivityItem['status'] } {
  const value = action.toLowerCase();
  if (/payment|reconcil|expense|adjust|revers|pool|disburs|ledger|fee/.test(value)) {
    return { category: 'financial', status: /reject|fail|variance/.test(value) ? 'warning' : 'success' };
  }
  if (/approv|reject|register|loan|borrower|group|flag|invite|user/.test(value)) {
    return { category: 'workflow', status: /reject|suspend|blacklist/.test(value) ? 'danger' : 'info' };
  }
  if (/notif|sms|email|push|remind/.test(value)) {
    return { category: 'notification', status: 'info' };
  }
  if (/communicat|broadcast|template/.test(value)) {
    return { category: 'communication', status: 'info' };
  }
  if (/login|logout|password|role|permission|mfa/.test(value)) {
    return { category: 'security', status: /fail/.test(value) ? 'danger' : 'warning' };
  }
  return { category: 'system', status: 'info' };
}

function resolveHref(entry: AuditEntry): string | undefined {
  const type = String(entry.targetEntityType ?? '').toUpperCase();
  const id = entry.targetEntityId;
  if (!id) return undefined;
  if (type.includes('BORROWER')) return `/borrowers/${id}`;
  if (type.includes('LOAN') && !type.includes('POOL')) return `/loans/${id}`;
  if (type.includes('GROUP')) return `/groups/${id}`;
  if (type.includes('USER')) return `/settings?tab=users`;
  if (type.includes('RISK')) return `/risk-flags`;
  if (type.includes('PAYMENT') || type.includes('RECONCIL')) return `/reports/daily-collection`;
  if (type.includes('EXPENSE')) return `/expenses`;
  return `/reports/audit-log`;
}

function summarizeMessage(action: string, reason?: string | null): string {
  const label = String(action).replace(/[._]/g, ' ').trim();
  const detail = reason?.trim();
  if (!detail) return label;
  // Prefer short human reasons; hide raw UUID / technical dumps on the dashboard preview.
  if (/^[0-9a-f-]{20,}$/i.test(detail) || /userid\s*=/i.test(detail) || detail.length > 72) {
    return label;
  }
  return `${label} — ${detail}`;
}

function toActivityItem(entry: AuditEntry): ActivityItem {
  const { category, status } = classifyAction(String(entry.action));
  const actor = entry.actorDisplayName ?? entry.actorDisplayId ?? 'System';
  return {
    id: entry.id,
    message: summarizeMessage(String(entry.action), entry.reason),
    createdAt: entry.createdAt,
    category,
    href: resolveHref(entry),
    status,
    actor,
  };
}

const CATEGORY_ICON = {
  financial: Wallet,
  workflow: Users,
  notification: MessageSquare,
  communication: MessageSquare,
  security: ShieldAlert,
  system: FileText,
} as const;

const STATUS_CLASS = {
  info: 'border-status-info/30 bg-status-info-light text-status-info',
  warning: 'border-status-at-risk/30 bg-status-at-risk-light text-status-at-risk',
  danger: 'border-danger/30 bg-danger/5 text-danger',
  success: 'border-status-active/30 bg-status-active-light text-status-active',
} as const;

export interface DashboardRecentActivityProps {
  /** @deprecated Alerts are no longer the authoritative source; audit log is used. */
  alerts?: unknown[];
  /** Preview count on the operational dashboard (default 2). */
  limit?: number;
  showViewAll?: boolean;
}

export function DashboardRecentActivity({
  limit = 2,
  showViewAll = true,
}: DashboardRecentActivityProps) {
  const { user } = useAuth();
  const canViewAudit =
    user?.role === USER_ROLE.SUPER_ADMIN ||
    user?.role === USER_ROLE.AUDITOR ||
    user?.role === USER_ROLE.APPROVER;

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'recent-activity', limit] as const,
    queryFn: () => auditService.listRecentEntries({ limit: Math.max(limit, 12) }),
    enabled: Boolean(canViewAudit),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    return (activityQuery.data ?? [])
      .map(toActivityItem)
      .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index)
      .slice(0, limit);
  }, [activityQuery.data, limit]);

  const totalAvailable = activityQuery.data?.length ?? 0;

  if (!canViewAudit) {
    return (
      <GuidedEmptyState
        title="Activity requires audit access"
        description="Your role cannot view the authoritative audit timeline. Ask a Super Admin to grant audit visibility if needed."
      />
    );
  }

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (activityQuery.isError) {
    return (
      <div className="rounded-sm border border-danger/30 bg-danger/5 px-wilms-4 py-wilms-4" role="alert">
        <p className="font-semibold text-text-primary">Unable to load recent activity</p>
        <p className="mt-1 text-small text-text-muted">
          Refresh the page or open the audit log. No raw server details are shown here.
        </p>
        <button
          type="button"
          className="mt-wilms-3 text-small font-semibold text-brand-primary"
          onClick={() => void activityQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <GuidedEmptyState
        title="No recent activity yet"
        description="Audit-backed events from collections, approvals, expenses, and communications will appear here."
        whyEmpty="The system has not recorded qualifying audit events in the current window."
        howToStart="Complete an operational action, then return here or open the full audit log."
        actionHref="/reports/audit-log"
        actionLabel="Open audit log"
      />
    );
  }

  return (
    <div className="space-y-wilms-3" data-testid="dashboard-recent-activity">
      <ol className="space-y-wilms-2">
        {items.map((item) => {
          const Icon = CATEGORY_ICON[item.category] ?? Info;
          const StatusIcon = item.status === 'danger' || item.status === 'warning' ? AlertTriangle : Icon;
          const body = (
            <div className="flex items-start gap-wilms-3">
              <span
                className={cn(
                  'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                  STATUS_CLASS[item.status],
                )}
                aria-hidden="true"
              >
                <StatusIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold capitalize text-text-primary">
                  {item.message}
                </p>
                <p className="mt-wilms-1 text-small text-text-muted">
                  {item.actor ? `${item.actor} · ` : ''}
                  {new Intl.DateTimeFormat('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(item.createdAt))}
                </p>
              </div>
            </div>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-sm border border-border bg-background px-wilms-3 py-wilms-2 transition-colors hover:border-brand-primary/40"
                >
                  {body}
                </Link>
              ) : (
                <div className="rounded-sm border border-border bg-background px-wilms-3 py-wilms-2">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {showViewAll ? (
        <div className="flex items-center justify-between gap-wilms-2 pt-wilms-1">
          <p className="text-small text-text-muted">
            Showing {items.length}
            {totalAvailable > items.length ? ` of latest events` : ''}
          </p>
          <Link
            href="/reports/audit-log"
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            View all activity
          </Link>
        </div>
      ) : null}
    </div>
  );
}
