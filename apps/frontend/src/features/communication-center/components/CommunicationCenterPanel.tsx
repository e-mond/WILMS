'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, FilterPillBar, ManagementToolbar } from '@/components/layout/executive';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PERMISSION } from '@/constants/permissions';
import { communicationService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { AudienceType, CommunicationChannel, MessageStatus } from '@/types/communication';
import { formatDisplayDate } from '@/utils/format-date';

const TABS = [
  { id: 'compose', label: 'Compose' },
  { id: 'outbox', label: 'Outbox' },
  { id: 'templates', label: 'Templates' },
  { id: 'delivery', label: 'Delivery Reports' },
  { id: 'failed', label: 'Failed Messages' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AUDIENCE_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: 'ALL_USERS', label: 'All Users' },
  { value: 'ALL_COLLECTORS', label: 'All Collectors' },
  { value: 'ALL_OFFICERS', label: 'All Registration Officers' },
  { value: 'ALL_APPROVERS', label: 'All Approvers' },
  { value: 'ALL_ADMINS', label: 'All Super Admins' },
];

function statusVariant(status: MessageStatus): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'SENT':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'SCHEDULED':
      return 'warning';
    default:
      return 'default';
  }
}

export function CommunicationCenterPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('compose');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('ALL_USERS');
  const [channels, setChannels] = useState<CommunicationChannel[]>(['EMAIL', 'IN_APP']);
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const analyticsQuery = useQuery({
    queryKey: ['communications', 'analytics'],
    queryFn: () => communicationService.getAnalytics(),
  });

  const messagesQuery = useQuery({
    queryKey: ['communications', 'messages', statusFilter],
    queryFn: () => communicationService.listMessages(statusFilter || undefined),
    enabled: activeTab === 'outbox',
  });

  const templatesQuery = useQuery({
    queryKey: ['communications', 'templates'],
    queryFn: () => communicationService.listTemplates(),
    enabled: activeTab === 'templates',
  });

  const failedQuery = useQuery({
    queryKey: ['communications', 'failed'],
    queryFn: () => communicationService.listFailedDeliveries(),
    enabled: activeTab === 'failed',
  });

  const createMessage = useMutation({
    mutationFn: () =>
      communicationService.createMessage({
        subject,
        bodyHtml: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
        bodyText: body,
        channels,
        audienceType,
      }),
    onSuccess: async (message) => {
      await communicationService.sendMessage(message.id);
      toastSuccess('Message sent');
      setShowCompose(false);
      setSubject('');
      setBody('');
      void queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
    onError: () => toastError('Failed to send message'),
  });

  const kpis = useMemo(
    () => [
      { label: 'Messages Sent', value: String(analyticsQuery.data?.totalSent ?? 0) },
      { label: 'Success Rate', value: `${analyticsQuery.data?.successRate ?? 0}%` },
      { label: 'Failed', value: String(analyticsQuery.data?.totalFailed ?? 0) },
      { label: 'Open Rate', value: `${analyticsQuery.data?.openRate ?? 0}%` },
    ],
    [analyticsQuery.data],
  );

  function toggleChannel(channel: CommunicationChannel) {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((entry) => entry !== channel)
        : [...current, channel],
    );
  }

  return (
    <div className="space-y-wilms-6">
      <ExecutiveKpiGrid>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </ExecutiveKpiGrid>

      <FilterPillBar
        options={TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
        value={activeTab}
        onChange={(value) => setActiveTab(value as TabId)}
        ariaLabel="Communication center sections"
      />

      <ManagementToolbar
        search={<Input placeholder="Search messages…" aria-label="Search messages" disabled />}
        actions={
          <PermissionGate permission={PERMISSION.MANAGE_COMMUNICATIONS}>
            <Button type="button" onClick={() => setShowCompose(true)}>
              Compose Message
            </Button>
          </PermissionGate>
        }
      />

      {activeTab === 'outbox' ? (
        <QueryStatePanel
          isLoading={messagesQuery.isLoading}
          showLoading={messagesQuery.isLoading}
          isError={messagesQuery.isError}
          error={messagesQuery.error}
          onRetry={() => void messagesQuery.refetch()}
        >
          <div className="mb-wilms-4 flex gap-wilms-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
          <DataTable<import('@/types/communication').CommunicationMessage>
            variant="executive"
            data={messagesQuery.data ?? []}
            getRowId={(row) => row.id}
            emptyMessage="No messages yet."
            columns={[
              { id: 'subject', header: 'Subject', cell: (row) => row.subject },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
              },
              { id: 'audience', header: 'Audience', cell: (row) => row.audienceType },
              { id: 'recipients', header: 'Recipients', cell: (row) => row.recipientCount },
              {
                id: 'sentAt',
                header: 'Sent',
                cell: (row) => (row.sentAt ? formatDisplayDate(row.sentAt) : '—'),
              },
            ]}
          />
        </QueryStatePanel>
      ) : null}

      {activeTab === 'templates' ? (
        <QueryStatePanel
          isLoading={templatesQuery.isLoading}
          showLoading={templatesQuery.isLoading}
          isError={templatesQuery.isError}
          error={templatesQuery.error}
          onRetry={() => void templatesQuery.refetch()}
        >
          <DataTable<import('@/types/communication').CommunicationTemplate>
            variant="executive"
            data={templatesQuery.data ?? []}
            getRowId={(row) => row.id}
            emptyMessage="No templates yet."
            columns={[
              { id: 'name', header: 'Name', cell: (row) => row.name },
              { id: 'category', header: 'Category', cell: (row) => row.category },
              { id: 'subject', header: 'Subject', cell: (row) => row.subject },
              { id: 'channels', header: 'Channels', cell: (row) => row.channels.join(', ') },
            ]}
          />
        </QueryStatePanel>
      ) : null}

      {activeTab === 'delivery' ? (
        <div className="rounded-lg border border-border bg-card p-wilms-6">
          <h3 className="text-h3 font-semibold text-text-primary">Delivery Analytics</h3>
          <div className="mt-wilms-4 grid gap-wilms-4 sm:grid-cols-3">
            <div>
              <p className="text-small text-text-muted">Emails</p>
              <p className="text-h2 font-semibold">{analyticsQuery.data?.emailCount ?? 0}</p>
            </div>
            <div>
              <p className="text-small text-text-muted">SMS</p>
              <p className="text-h2 font-semibold">{analyticsQuery.data?.smsCount ?? 0}</p>
            </div>
            <div>
              <p className="text-small text-text-muted">Click Rate</p>
              <p className="text-h2 font-semibold">{analyticsQuery.data?.clickRate ?? 0}%</p>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'failed' ? (
        <QueryStatePanel
          isLoading={failedQuery.isLoading}
          showLoading={failedQuery.isLoading}
          isError={failedQuery.isError}
          error={failedQuery.error}
          onRetry={() => void failedQuery.refetch()}
        >
          <DataTable<import('@/types/communication').FailedDelivery>
            variant="executive"
            data={failedQuery.data ?? []}
            getRowId={(row) => row.id}
            emptyMessage="No failed deliveries."
            columns={[
              { id: 'event', header: 'Event', cell: (row) => row.event },
              { id: 'channel', header: 'Channel', cell: (row) => row.channel },
              { id: 'recipient', header: 'Recipient', cell: (row) => row.recipient },
              { id: 'reason', header: 'Reason', cell: (row) => row.failureReason ?? '—' },
            ]}
          />
        </QueryStatePanel>
      ) : null}

      {activeTab === 'compose' && !showCompose ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-wilms-8 text-center">
          <p className="text-body text-text-muted">Compose a new message or broadcast to your audience.</p>
          <Button type="button" className="mt-wilms-4" onClick={() => setShowCompose(true)}>
            Start Composing
          </Button>
        </div>
      ) : null}

      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Message">
        <div className="space-y-wilms-4">
          <div>
            <label className="mb-wilms-2 block text-small font-medium text-text-primary">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              aria-label="Subject"
            />
          </div>
          <div>
            <label className="mb-wilms-2 block text-small font-medium text-text-primary">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write your message..."
              aria-label="Message"
            />
          </div>
          <div>
            <label className="mb-wilms-2 block text-small font-medium text-text-primary">Audience</label>
            <Select
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value as AudienceType)}
              aria-label="Audience"
            >
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            </Select>
          </div>
          <div>
            <p className="mb-wilms-2 text-small font-medium text-text-primary">Channels</p>
            <div className="flex flex-wrap gap-wilms-3">
              {(['EMAIL', 'SMS', 'IN_APP'] as CommunicationChannel[]).map((channel) => (
                <label key={channel} className="flex items-center gap-wilms-2 text-small">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-wilms-2">
            <Button type="button" variant="secondary" onClick={() => setShowCompose(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!subject.trim() || !body.trim() || createMessage.isPending}
              onClick={() => createMessage.mutate()}
            >
              {createMessage.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
