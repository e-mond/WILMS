'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, FilterDropdown, FilterDropdownRow, ManagementToolbar } from '@/components/layout/executive';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PERMISSION } from '@/constants/permissions';
import { communicationService } from '@/services';
import { formatDeliveryFailure } from '@/utils/format-delivery-failure';
import { useToast } from '@/hooks/useToast';
import type { AudienceType, CommunicationChannel, MessageAttachment, MessageStatus } from '@/types/communication';
import { formatDisplayDate } from '@/utils/format-date';
import { RichTextEditor } from '@/features/communication-center/components/RichTextEditor';
import { AttachmentUploader } from '@/features/communication-center/components/AttachmentUploader';
import { AnalyticsCharts } from '@/features/communication-center/components/AnalyticsCharts';
import { TemplateBuilderModal } from '@/features/communication-center/components/TemplateBuilderModal';

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

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Send immediately' },
  { value: 'SCHEDULED', label: 'Scheduled (one-time)' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: '0 9 * * *', label: 'Custom (daily 9:00 UTC)' },
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

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function CommunicationCenterPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('compose');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('ALL_USERS');
  const [channels, setChannels] = useState<CommunicationChannel[]>(['EMAIL', 'IN_APP']);
  const [scheduleMode, setScheduleMode] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
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
    mutationFn: async () => {
      const isScheduled = scheduleMode === 'SCHEDULED';
      const recurrenceRule =
        scheduleMode && scheduleMode !== 'SCHEDULED' ? scheduleMode : undefined;

      const message = await communicationService.createMessage({
        subject,
        bodyHtml,
        bodyText: htmlToText(bodyHtml),
        channels,
        audienceType,
        scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        recurrenceRule,
        recurrenceTimezone: 'Africa/Accra',
        attachmentIds: attachments.map((entry) => entry.id),
      });

      if (!isScheduled && !recurrenceRule) {
        await communicationService.sendMessage(message.id);
      }

      return message;
    },
    onSuccess: () => {
      toastSuccess(scheduleMode ? 'Message scheduled' : 'Message sent');
      setShowCompose(false);
      setSubject('');
      setBodyHtml('');
      setAttachments([]);
      setScheduleMode('');
      setScheduledAt('');
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

      <ManagementToolbar
        filters={
          <FilterDropdownRow>
            <FilterDropdown
              label="Section"
              ariaLabel="Communication center sections"
              options={TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
              value={activeTab}
              onChange={(value) => setActiveTab(value as TabId)}
            />
          </FilterDropdownRow>
        }
        search={<Input placeholder="Search messages…" aria-label="Search messages" disabled />}
        actions={
          <div className="flex flex-wrap gap-wilms-2">
            <PermissionGate permission={PERMISSION.MANAGE_COMMUNICATIONS}>
              <Button type="button" variant="secondary" onClick={() => setShowTemplateBuilder(true)}>
                New Template
              </Button>
              <Button type="button" onClick={() => setShowCompose(true)}>
                Compose Message
              </Button>
            </PermissionGate>
          </div>
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
              {
                id: 'variables',
                header: 'Variables',
                cell: (row) => (row.variables?.length ? row.variables.join(', ') : '—'),
              },
            ]}
          />
        </QueryStatePanel>
      ) : null}

      {activeTab === 'delivery' ? (
        <div className="rounded-lg border border-border bg-card p-wilms-6">
          <h3 className="text-h3 font-semibold text-text-primary">Delivery Analytics</h3>
          <AnalyticsCharts analytics={analyticsQuery.data} />
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
              {
                id: 'reason',
                header: 'Reason',
                cell: (row) => {
                  const failure = formatDeliveryFailure(row.failureReason);
                  return (
                    <div>
                      <p className="font-semibold text-text-primary">{failure.summary}</p>
                      <p className="text-small text-text-muted">{failure.details}</p>
                    </div>
                  );
                },
              },
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
            <RichTextEditor value={bodyHtml} onChange={setBodyHtml} draftKey="communication-compose" />
          </div>
          <AttachmentUploader attachments={attachments} onChange={setAttachments} />
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
            <label className="mb-wilms-2 block text-small font-medium text-text-primary">Schedule</label>
            <Select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value)} aria-label="Schedule">
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value || 'immediate'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {scheduleMode === 'SCHEDULED' ? (
              <input
                type="datetime-local"
                className="mt-wilms-2 h-10 w-full rounded-sm border border-border bg-card px-wilms-3 text-body"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                aria-label="Scheduled date and time"
              />
            ) : null}
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
              disabled={!subject.trim() || !bodyHtml.trim() || createMessage.isPending}
              onClick={() => createMessage.mutate()}
            >
              {createMessage.isPending ? 'Sending…' : scheduleMode ? 'Schedule' : 'Send'}
            </Button>
          </div>
        </div>
      </Modal>

      <TemplateBuilderModal
        isOpen={showTemplateBuilder}
        onClose={() => setShowTemplateBuilder(false)}
        onSaved={() => void queryClient.invalidateQueries({ queryKey: ['communications', 'templates'] })}
      />
    </div>
  );
}
