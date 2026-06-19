import type { ReactNode } from 'react';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { cn } from '@/utils/cn';

export interface ActivityFeedItem {
  id: string;
  message: string;
  recordedAt: string;
  tone?: 'default' | 'danger' | 'warning' | 'success';
  icon?: ReactNode;
}

export interface ActivityFeedProps {
  items: readonly ActivityFeedItem[];
  className?: string;
  emptyMessage?: string;
}

const TONE_CLASS = {
  default: 'text-text-primary',
  danger: 'text-danger',
  warning: 'text-status-at-risk',
  success: 'text-status-active',
} as const;

export function ActivityFeed({
  items,
  className,
  emptyMessage = 'No recent activity.',
}: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="text-small text-text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className={cn('space-y-wilms-3 text-small', className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-wilms-3">
          {item.icon ?? null}
          <div className="min-w-0 flex-1">
            <p className={cn('font-semibold', TONE_CLASS[item.tone ?? 'default'])}>{item.message}</p>
            <p className="text-text-muted">{formatRelativeTime(item.recordedAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
