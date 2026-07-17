'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMessageCollector } from '@/features/collector-management/hooks/useMessageCollector';
import { messageService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';
import { formatDisplayDate } from '@/utils/format-date';

export function CollectorMessagesPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const { sendMessage } = useMessageCollector();

  const threadsQuery = useQuery({
    queryKey: ['message-threads'],
    queryFn: () => messageService.listThreads(),
    refetchInterval: 15_000,
  });

  const threadQuery = useQuery({
    queryKey: ['message-thread', selectedThreadId],
    queryFn: () => messageService.getThread(selectedThreadId!),
    enabled: Boolean(selectedThreadId),
    refetchInterval: 10_000,
  });

  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const activeThread = threadQuery.data;

  if (threadsQuery.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (!threads.length) {
    return (
      <EmptyState
        title="No messages yet"
        description="When Super Admin sends you a message, it will appear here with notification alerts."
      />
    );
  }

  return (
    <div className="grid gap-wilms-4 lg:grid-cols-[minmax(14rem,18rem)_1fr]">
      <aside className="rounded-sm border border-border bg-card">
        <div className="border-b border-border px-wilms-4 py-wilms-3">
          <h2 className="text-heading-3 font-semibold text-text-primary">Inbox</h2>
        </div>
        <ul className="divide-y divide-border" role="list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                className={cn(
                  'w-full px-wilms-4 py-wilms-3 text-left transition-colors hover:bg-background',
                  selectedThreadId === thread.id && 'bg-brand-primary-light',
                )}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <p className="font-semibold text-text-primary">{thread.adminDisplayName}</p>
                <p className="line-clamp-2 text-small text-text-muted">
                  {thread.lastMessagePreview ?? 'No messages yet'}
                </p>
                {thread.lastMessageAt ? (
                  <p className="mt-wilms-1 text-small text-text-muted">
                    {formatDisplayDate(thread.lastMessageAt)}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="rounded-sm border border-border bg-card p-wilms-4">
        {!activeThread ? (
          <p className="text-body text-text-muted">Select a conversation to read messages.</p>
        ) : (
          <div className="flex h-full flex-col gap-wilms-4">
            <div>
              <h2 className="text-heading-2 font-semibold text-text-primary">
                {activeThread.adminDisplayName}
              </h2>
              <p className="text-small text-text-muted">Secure supervisor messaging</p>
            </div>

            <div className="min-h-[16rem] flex-1 space-y-wilms-3 overflow-y-auto rounded-sm border border-border bg-background p-wilms-3">
              {activeThread.messages.length ? (
                activeThread.messages.map((message) => {
                  const isMine = message.senderUserId === user?.id;
                  return (
                    <article
                      key={message.id}
                      className={cn(
                        'max-w-[85%] rounded-sm px-wilms-3 py-wilms-2 text-small',
                        isMine
                          ? 'ml-auto bg-brand-primary text-card'
                          : 'bg-card text-text-primary border border-border',
                      )}
                    >
                      <p className="font-semibold">{message.senderDisplayName}</p>
                      <p className="mt-wilms-1 whitespace-pre-wrap">{message.body}</p>
                      <p className={cn('mt-wilms-1 text-[11px]', isMine ? 'text-card/80' : 'text-text-muted')}>
                        {formatDisplayDate(message.sentAt)}
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="text-small text-text-muted">No messages in this thread yet.</p>
              )}
            </div>

            <form
              className="flex flex-col gap-wilms-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedThreadId || !messageBody.trim()) {
                  return;
                }

                void sendMessage
                  .mutateAsync({ threadId: selectedThreadId, body: messageBody.trim() })
                  .then(() => {
                    setMessageBody('');
                    void threadQuery.refetch();
                    void threadsQuery.refetch();
                  })
                  .catch(() => {
                    toast.error('Unable to send message');
                  });
              }}
            >
              <Input
                aria-label="Reply message"
                placeholder="Type your reply"
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={sendMessage.isPending || !messageBody.trim()}>
                {sendMessage.isPending ? 'Sending…' : 'Send'}
              </Button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
