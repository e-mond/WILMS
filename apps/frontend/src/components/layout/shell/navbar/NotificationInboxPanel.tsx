'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Avatar } from '@/components/data-display/Avatar';
import {
  useMarkNotificationRead,
  useNotificationInbox,
  useNotificationUnreadCount,
} from '@/features/notifications/hooks/useNotificationInbox';
import { NotificationBellIcon } from '@/components/icons/NotificationBellIcon';
import { useUiStore } from '@/state/uiStore';
import { NOTIFICATION_INBOX_SEVERITY } from '@/types/notification';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { cn } from '@/utils/cn';

function severityConfig(severity: string): { className: string; label: string; dot: string } {
  switch (severity) {
    case NOTIFICATION_INBOX_SEVERITY.CRITICAL:
      return {
        className: 'bg-danger/10 text-danger border-danger/20',
        label: 'Critical',
        dot: 'bg-danger',
      };
    case NOTIFICATION_INBOX_SEVERITY.WARNING:
      return {
        className: 'bg-status-at-risk-light text-status-at-risk border-status-at-risk/20',
        label: 'Warning',
        dot: 'bg-status-at-risk',
      };
    default:
      return {
        className: 'bg-background text-text-muted border-border',
        label: severity,
        dot: 'bg-text-muted',
      };
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function NotificationInboxPanel() {
  const router = useRouter();
  const isOpen = useUiStore((state) => state.isNotificationPanelOpen);
  const closeNotificationPanel = useUiStore((state) => state.closeNotificationPanel);
  const { data: items = [], isLoading } = useNotificationInbox(isOpen);
  const markAsRead = useMarkNotificationRead();

  const unreadItems = items.filter((i) => !i.isRead);
  const hasUnread = unreadItems.length > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeNotificationPanel}
      title="Notifications"
      side="right"
      className="ml-auto w-96 max-w-[90vw] shadow-lg"
    >
      {/* Fixed header: title row + meta — stays visible while list scrolls */}
      <div className="flex flex-col">
        {/* Header meta row */}
        {!isLoading && items.length > 0 && (
          <div className="mb-wilms-4 flex items-center justify-between">
            <span className="text-small text-text-muted">
              {hasUnread ? `${unreadItems.length} unread` : 'All caught up'}
            </span>
            {hasUnread && (
              <button
                type="button"
                className="text-small font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
                onClick={() => {
                  unreadItems.forEach((item) => void markAsRead.mutateAsync(item.id));
                }}
              >
                Mark all read
              </button>
            )}
          </div>
        )}

        {/* Scrollable notification list */}
        <div className="overflow-y-auto overscroll-contain flex-1 pb-wilms-4">
          {/* States */}
          {isLoading ? (
            <div className="flex flex-col gap-wilms-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-border bg-card p-wilms-4"
                >
                  <div className="mb-wilms-2 h-4 w-2/3 rounded bg-border" />
                  <div className="h-3 w-full rounded bg-border" />
                  <div className="mt-wilms-1 h-3 w-4/5 rounded bg-border" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-wilms-3 py-wilms-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                <NotificationBellIcon className="h-6 w-6 text-text-muted" />
              </div>
              <div>
                <p className="text-body font-semibold text-text-primary">No notifications yet</p>
                <p className="mt-wilms-1 text-small text-text-muted">
                  You&apos;re all caught up. We&apos;ll let you know when something needs attention.
                </p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-wilms-2">
              {items.map((item) => {
                const severity = severityConfig(item.severity);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'group relative rounded-lg border transition-shadow hover:shadow-sm',
                      item.isRead
                        ? 'border-border bg-card'
                        : 'border-brand-primary/30 bg-brand-primary-light/10',
                    )}
                  >
                    {/* Unread indicator stripe */}
                    {!item.isRead && (
                      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-brand-primary" />
                    )}

                    <div className="p-wilms-4 pl-wilms-5">
                      <div className="flex items-start gap-wilms-3">
                        {item.subjectName ? (
                          <Avatar
                            label={item.subjectName}
                            photoUrl={resolveEntityPhotoUrl({
                              name: item.subjectName,
                              id: item.subjectId,
                              photoUrl: item.subjectPhotoUrl,
                            })}
                            size="sm"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                      {/* Top row: title + severity badge */}
                      <div className="flex items-start justify-between gap-wilms-3">
                        <p className={cn(
                          'text-body leading-snug',
                          item.isRead ? 'font-medium text-text-primary' : 'font-semibold text-text-primary',
                        )}>
                          {item.title}
                        </p>
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 rounded-full border px-wilms-2 py-0.5 text-small font-medium',
                            severity.className,
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', severity.dot)} />
                          {severity.label}
                        </span>
                      </div>

                      {/* Body */}
                      {item.body && (
                        <p className="mt-wilms-1 text-small text-text-muted line-clamp-2">{item.body}</p>
                      )}

                      {/* Footer row: timestamp + actions */}
                      <div className="mt-wilms-3 flex items-center justify-between gap-wilms-2">
                        <time
                          dateTime={item.createdAt}
                          className="text-small text-text-muted"
                          title={new Intl.DateTimeFormat('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(item.createdAt))}
                        >
                          {formatRelativeTime(new Date(item.createdAt))}
                        </time>

                        <div className="flex items-center gap-wilms-2">
                          {!item.isRead && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={markAsRead.isPending}
                              onClick={() => void markAsRead.mutateAsync(item.id)}
                              className="text-small text-text-muted hover:text-text-primary"
                            >
                              Mark read
                            </Button>
                          )}
                          {item.href && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (!item.isRead) void markAsRead.mutateAsync(item.id);
                                closeNotificationPanel();
                                router.push(item.href!);
                              }}
                            >
                              View →
                            </Button>
                          )}
                        </div>
                      </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export function NotificationInboxTrigger() {
  const openNotificationPanel = useUiStore((state) => state.openNotificationPanel);
  const { data: unreadCount = 0 } = useNotificationUnreadCount();

  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border transition-colors',
        'border-border bg-card text-text-primary',
        'hover:bg-background hover:border-brand-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
      )}
      aria-label={
        unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'
      }
      onClick={openNotificationPanel}
    >
      <NotificationBellIcon className="h-[18px] w-[18px]" />

      {unreadCount > 0 && (
        <span
          aria-hidden
          className={cn(
            'absolute -right-1.5 -top-1.5 flex min-h-[18px] min-w-[18px] items-center justify-center',
            'rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white',
            'ring-2 ring-card',
          )}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}