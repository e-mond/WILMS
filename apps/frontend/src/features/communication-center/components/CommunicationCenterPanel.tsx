'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, FilterDropdown, FilterDropdownRow, ManagementToolbar } from '@/components/layout/executive';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PERMISSION } from '@/constants/permissions';
import { communicationService } from '@/services';
import { formatDeliveryFailure } from '@/utils/format-delivery-failure';
import { useToast } from '@/hooks/useToast';
import type {
  AudiencePreviewResult,
  CommunicationChannel,
  MessageAttachment,
  MessageStatus,
} from '@/types/communication';
import { formatDisplayDate } from '@/utils/format-date';
import { RichTextEditor } from '@/features/communication-center/components/RichTextEditor';
import { AttachmentUploader } from '@/features/communication-center/components/AttachmentUploader';
import { AnalyticsCharts } from '@/features/communication-center/components/AnalyticsCharts';
import { TemplateBuilderModal } from '@/features/communication-center/components/TemplateBuilderModal';
import {
  AudienceComposer,
  type AudienceComposerValue,
} from '@/features/communication-center/components/AudienceComposer';
import { cn } from '@/utils/cn';

const TABS = [
  { id: 'compose', label: 'Compose' },
  { id: 'outbox', label: 'Outbox' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'templates', label: 'Templates' },
  { id: 'delivery', label: 'Delivery Reports' },
  { id: 'failed', label: 'Failed Messages' },
] as const;

type TabId = (typeof TABS)[number]['id'];

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
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [audience, setAudience] = useState<AudienceComposerValue>({
    audienceType: 'ALL_COLLECTORS',
  });
  const [audiencePreview, setAudiencePreview] = useState<AudiencePreviewResult | null>(null);
  const [channels, setChannels] = useState<CommunicationChannel[]>(['EMAIL', 'IN_APP', 'SMS']);
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
    enabled: activeTab === 'outbox' || activeTab === 'campaigns',
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

  const requestPreview = useCallback(() => {
    void communicationService
      .previewAudience({
        audienceType: audience.audienceType,
        audienceFilter: audience.audienceFilter,
        sampleLimit: 20,
      })
      .then((data) => setAudiencePreview(data))
      .catch(() => setAudiencePreview(null));
  }, [audience.audienceFilter, audience.audienceType]);

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
        audienceType: audience.audienceType,
        audienceFilter: audience.audienceFilter,
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
      setSubject('');
      setBodyHtml('');
      setAttachments([]);
      setScheduleMode('');
      setScheduledAt('');
      setAudience({ audienceType: 'ALL_COLLECTORS' });
      setAudiencePreview(null);
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
              <Button type="button" onClick={() => setActiveTab('compose')}>
                Compose Message
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {activeTab === 'outbox' || activeTab === 'campaigns' ? (
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
            mobileLayout="stack"
            variant="executive"
            data={messagesQuery.data ?? []}
            getRowId={(row) => row.id}
            emptyMessage={
              activeTab === 'campaigns' ? 'No campaigns yet.' : 'No messages yet.'
            }
            columns={
              activeTab === 'campaigns'
                ? [
                    { id: 'subject', header: 'Campaign', cell: (row) => row.subject },
                    {
                      id: 'status',
                      header: 'Status',
                      cell: (row) => (
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      ),
                    },
                    { id: 'audience', header: 'Audience', cell: (row) => row.audienceType },
                    {
                      id: 'channels',
                      header: 'Channels',
                      cell: (row) => row.channels.join(', '),
                    },
                    { id: 'recipients', header: 'Recipients', cell: (row) => row.recipientCount },
                    {
                      id: 'delivery',
                      header: 'Delivery',
                      cell: (row) => {
                        if (row.status === 'SENT') return 'Delivered';
                        if (row.status === 'FAILED') return 'Failed';
                        if (row.status === 'SCHEDULED') return 'Scheduled';
                        if (row.status === 'SENDING') return 'In progress';
                        return 'Draft';
                      },
                    },
                    {
                      id: 'sentAt',
                      header: 'Completed',
                      cell: (row) => (row.sentAt ? formatDisplayDate(row.sentAt) : '—'),
                    },
                  ]
                : [
                    { id: 'subject', header: 'Subject', cell: (row) => row.subject },
                    {
                      id: 'status',
                      header: 'Status',
                      cell: (row) => (
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      ),
                    },
                    { id: 'audience', header: 'Audience', cell: (row) => row.audienceType },
                    { id: 'recipients', header: 'Recipients', cell: (row) => row.recipientCount },
                    {
                      id: 'sentAt',
                      header: 'Sent',
                      cell: (row) => (row.sentAt ? formatDisplayDate(row.sentAt) : '—'),
                    },
                  ]
            }
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
            mobileLayout="stack"
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
            mobileLayout="stack"
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
                  return <span title={failure.details || undefined}>{failure.summary}</span>;
                },
              },
            ]}
          />
        </QueryStatePanel>
      ) : null}

      {activeTab === 'compose' ? (
        <div className="grid gap-wilms-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Choose who should receive this message.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-wilms-4">
              <AudienceComposer
                value={audience}
                onChange={setAudience}
                preview={audiencePreview}
                onRequestPreview={requestPreview}
                previewPending={false}
              />
              <div className="rounded-xl border border-border/70 bg-background/60 p-wilms-3 text-small">
                <p className="font-semibold text-text-primary">Delivery summary</p>
                <p className="mt-wilms-1 text-text-muted">
                  Recipients:{' '}
                  <span className="font-semibold text-text-primary">
                    {audiencePreview?.total ?? 'Preview to estimate'}
                  </span>
                </p>
                <p className="mt-wilms-1 text-text-muted">
                  Channels:{' '}
                  <span className="font-semibold text-text-primary">
                    {channels.length ? channels.join(', ') : 'None selected'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
              <CardDescription>Write, preview, and send with validation intact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-wilms-4">
              <div>
                <label className="mb-wilms-2 block text-small font-medium text-text-primary">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value.slice(0, 120))}
                  placeholder="Message subject"
                  aria-label="Subject"
                />
                <p className="mt-wilms-1 text-right text-small text-text-muted">{subject.length}/120</p>
              </div>
              <div>
                <label className="mb-wilms-2 block text-small font-medium text-text-primary">Message</label>
                <RichTextEditor value={bodyHtml} onChange={setBodyHtml} draftKey="communication-compose" />
                <p className="mt-wilms-1 text-right text-small text-text-muted">
                  {htmlToText(bodyHtml).length} characters
                </p>
              </div>
              <AttachmentUploader attachments={attachments} onChange={setAttachments} />
              <div>
                <label className="mb-wilms-2 block text-small font-medium text-text-primary">Schedule</label>
                <Select
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value)}
                  aria-label="Schedule"
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value || 'immediate'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {scheduleMode === 'SCHEDULED' ? (
                  <input
                    type="datetime-local"
                    className="mt-wilms-2 h-10 w-full rounded-xl border border-border bg-card px-wilms-3 text-body"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    aria-label="Scheduled date and time"
                  />
                ) : null}
              </div>
              <div>
                <p className="mb-wilms-2 text-small font-medium text-text-primary">Channels</p>
                <div className="flex flex-wrap gap-wilms-2">
                  {(['EMAIL', 'SMS', 'IN_APP'] as CommunicationChannel[]).map((channel) => {
                    const active = channels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => toggleChannel(channel)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-small font-semibold transition-colors',
                          active
                            ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
                            : 'border-border text-text-muted hover:border-brand-primary/40',
                        )}
                        aria-pressed={active}
                      >
                        {channel}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/80 bg-background/50 p-wilms-3">
                <p className="text-small font-semibold text-text-primary">Preview</p>
                <p className="mt-wilms-2 text-body font-semibold text-text-primary">
                  {subject.trim() || 'Untitled message'}
                </p>
                <p className="mt-wilms-2 whitespace-pre-wrap text-small text-text-muted">
                  {htmlToText(bodyHtml) || 'Message body preview will appear here.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-wilms-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSubject('');
                    setBodyHtml('');
                    setAttachments([]);
                    setScheduleMode('');
                    setScheduledAt('');
                    setAudience({ audienceType: 'ALL_COLLECTORS' });
                    setAudiencePreview(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  disabled={
                    !subject.trim() || !bodyHtml.trim() || channels.length === 0 || createMessage.isPending
                  }
                  onClick={() => {
                    if (
                      !window.confirm(
                        scheduleMode
                          ? 'Schedule this message for the selected audience?'
                          : 'Send this message now to the selected audience?',
                      )
                    ) {
                      return;
                    }
                    createMessage.mutate();
                  }}
                >
                  {createMessage.isPending ? 'Sending…' : scheduleMode ? 'Schedule' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <TemplateBuilderModal
        isOpen={showTemplateBuilder}
        onClose={() => setShowTemplateBuilder(false)}
        onSaved={() => void queryClient.invalidateQueries({ queryKey: ['communications', 'templates'] })}
      />
    </div>
  );
}
