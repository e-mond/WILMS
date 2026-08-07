'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
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
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import auditService from '@/services/auditService';
import type { AuditEntry } from '@/types/services';
import { cn } from '@/utils/cn';
import { USER_ROLE } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { CurrencyAmount } from '@/components/data-display';

type ActivityCategory =
  | 'financial'
  | 'workflow'
  | 'notification'
  | 'communication'
  | 'security'
  | 'system';

interface ActivityItem {
  id: string;
  title: string;
  subject?: string;
  amountPesewas?: number;
  createdAt: string;
  category: ActivityCategory;
  href?: string;
  status: 'info' | 'warning' | 'danger' | 'success';
}

function humanTitle(action: string): string {
  const value = action.toLowerCase();
  if (/loan/.test(value) && /approv/.test(value)) return 'New loan approved';
  if (/loan/.test(value) && /reject/.test(value)) return 'Loan rejected';
  if (/payment|collection|repay/.test(value) && /record|creat|success/.test(value)) {
    return 'Collection recorded';
  }
  if (/reconcil/.test(value) && /submit/.test(value)) return 'Reconciliation submitted';
  if (/reconcil/.test(value) && /approv/.test(value)) return 'Reconciliation approved';
  if (/expense/.test(value) && /approv/.test(value)) return 'Expense approved';
  if (/expense/.test(value) && /submit|creat/.test(value)) return 'Expense submitted';
  if (/notif|campaign|broadcast|sms|email/.test(value) && /send|sent|dispatch/.test(value)) {
    return 'Notification campaign sent';
  }
  if (/borrower/.test(value) && /approv|register/.test(value)) return 'Borrower approved';
  if (/invite/.test(value)) return 'User invited';
  if (/login/.test(value)) return 'User signed in';
  if (/export/.test(value)) return 'Export generated';
  return String(action)
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function classifyAction(action: string): { category: ActivityCategory; status: ActivityItem['status'] } {
  const value = action.toLowerCase();
  if (/payment|reconcil|expense|adjust|revers|pool|disburs|ledger|fee|export/.test(value)) {
    return { category: 'financial', status: /reject|fail|variance/.test(value) ? 'warning' : 'success' };
  }
  if (/approv|reject|register|loan|borrower|group|flag|invite|user/.test(value)) {
    return { category: 'workflow', status: /reject|suspend|blacklist/.test(value) ? 'danger' : 'info' };
  }
  if (/notif|sms|email|push|remind|campaign/.test(value)) {
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

function parseAmountPesewas(entry: AuditEntry): number | undefined {
  const reason = entry.reason ?? '';
  const match = reason.match(/(?:amount|pesewas|ghs)[:=\s]*([\d,]+(?:\.\d+)?)/i);
  if (!match?.[1]) return undefined;
  const raw = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(raw)) return undefined;
  // Heuristic: values >= 1000 without decimal treated as pesewas; small decimals as GHS.
  if (raw < 1000 && String(match[1]).includes('.')) return Math.round(raw * 100);
  return Math.round(raw);
}

function toActivityItem(entry: AuditEntry): ActivityItem {
  const { category, status } = classifyAction(String(entry.action));
  const subject =
    entry.actorDisplayName ??
    entry.actorDisplayId ??
    (entry.targetEntityType ? String(entry.targetEntityType) : undefined);
  return {
    id: entry.id,
    title: humanTitle(String(entry.action)),
    subject,
    amountPesewas: parseAmountPesewas(entry),
    createdAt: entry.createdAt,
    category,
    href: resolveHref(entry),
    status,
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
  alerts?: unknown[];
  limit?: number;
  showViewAll?: boolean;
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = CATEGORY_ICON[item.category] ?? Info;
  const StatusIcon = item.status === 'danger' || item.status === 'warning' ? AlertTriangle : Icon;
  const body = (
    <div className="flex items-start gap-wilms-3">
      <span
        className={cn(
          'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          STATUS_CLASS[item.status],
        )}
        aria-hidden="true"
      >
        <StatusIcon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold text-text-primary">{item.title}</p>
        <p className="mt-wilms-1 truncate text-small text-text-muted">
          {item.subject ? `${item.subject} · ` : ''}
          {new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(item.createdAt))}
        </p>
      </div>
      {typeof item.amountPesewas === 'number' ? (
        <CurrencyAmount
          value={item.amountPesewas}
          className="shrink-0 whitespace-nowrap text-small font-semibold tabular-nums text-text-primary"
        />
      ) : null}
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="block rounded-sm border border-border bg-background px-wilms-3 py-wilms-3 transition-colors hover:border-brand-primary/40"
      >
        {body}
      </Link>
    );
  }

  return <div className="rounded-sm border border-border bg-background px-wilms-3 py-wilms-3">{body}</div>;
}

export function DashboardRecentActivity({
  limit = 3,
  showViewAll = true,
}: DashboardRecentActivityProps) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const canViewAudit =
    user?.role === USER_ROLE.SUPER_ADMIN ||
    user?.role === USER_ROLE.AUDITOR ||
    user?.role === USER_ROLE.APPROVER;

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'recent-activity', 'v172'] as const,
    queryFn: () => auditService.listRecentEntries({ limit: 40 }),
    enabled: Boolean(canViewAudit),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    return (activityQuery.data ?? [])
      .map(toActivityItem)
      .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index);
  }, [activityQuery.data]);

  const preview = items.slice(0, limit);
  const drawerItems = items.slice(0, 20);

  if (!canViewAudit) {
    return (
      <div data-testid="dashboard-recent-activity">
        <GuidedEmptyState
          title="Activity requires audit access"
          description="Your role cannot view the authoritative audit timeline."
        />
      </div>
    );
  }

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" data-testid="dashboard-recent-activity">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (activityQuery.isError) {
    return (
      <div className="rounded-sm border border-danger/30 bg-danger/5 px-wilms-4 py-wilms-4" role="alert" data-testid="dashboard-recent-activity">
        <p className="font-semibold text-text-primary">Unable to load recent activity</p>
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

  if (preview.length === 0) {
    return (
      <div data-testid="dashboard-recent-activity">
        <GuidedEmptyState
          title="No recent activity yet"
          description="Collections, approvals, and expenses will appear here as a concise summary."
          actionHref="/reports/audit-log"
          actionLabel="Open audit log"
        />
      </div>
    );
  }

  return (
    <div className="space-y-wilms-3" data-testid="dashboard-recent-activity">
      <ol className="space-y-wilms-2">
        {preview.map((item) => (
          <li key={item.id}>
            <ActivityRow item={item} />
          </li>
        ))}
      </ol>

      {showViewAll ? (
        <div className="flex flex-wrap items-center justify-between gap-wilms-2 pt-wilms-1">
          <p className="text-small text-text-muted">Showing {preview.length} latest events</p>
          <div className="flex flex-wrap gap-wilms-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
              View all activity
            </Button>
            <Link
              href="/reports/audit-log"
              className="inline-flex min-h-[36px] items-center text-small font-semibold text-brand-primary hover:underline"
            >
              Full audit log
            </Link>
          </div>
        </div>
      ) : null}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Recent activity"
        side="right"
        width="w-full max-w-md"
      >
        <p className="mb-wilms-4 text-small text-text-muted">
          Executive summary of the latest audit-backed events.
        </p>
        <ol className="space-y-wilms-2">
          {drawerItems.map((item) => (
            <li key={item.id}>
              <ActivityRow item={item} />
            </li>
          ))}
        </ol>
        <div className="mt-wilms-4 border-t border-border pt-wilms-3">
          <Link
            href="/reports/audit-log"
            className="text-small font-semibold text-brand-primary hover:underline"
            onClick={() => setDrawerOpen(false)}
          >
            Open full audit log
          </Link>
        </div>
      </Drawer>
    </div>
  );
}
