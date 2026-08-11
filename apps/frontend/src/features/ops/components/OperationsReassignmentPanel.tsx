'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PAYMENT_DAY_OPTIONS } from '@/constants/loan';
import { useCollectorsManagement } from '@/features/collector-management/hooks/useCollectorsManagement';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService, loanService } from '@/services';
import { ApiError } from '@/types/api';

type OpsTab = 'group' | 'collector' | 'payment-day';

export function OperationsReassignmentPanel() {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<OpsTab>('group');
  const [preview, setPreview] = useState<string | null>(null);

  const [sourceGroupId, setSourceGroupId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [collectorGroupId, setCollectorGroupId] = useState('');
  const [collectorId, setCollectorId] = useState('');
  const [loanId, setLoanId] = useState('');
  const [toPaymentDay, setToPaymentDay] = useState('Friday');
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  const groupsQuery = useQuery({
    queryKey: ['groups', 'ops-reassignment'],
    queryFn: () => groupService.listGroups(),
  });
  const groups = useMemo(() => groupsQuery.data?.groups ?? [], [groupsQuery.data]);
  const { data: collectorsData } = useCollectorsManagement();
  const collectors = useMemo(() => collectorsData?.collectors ?? [], [collectorsData]);

  const invalidateOperationalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['groups'] }),
      queryClient.invalidateQueries({ queryKey: ['borrowers'] }),
      queryClient.invalidateQueries({ queryKey: ['loans'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['collector-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ]);
  };

  const transferMutation = useMutation({
    mutationFn: () =>
      groupService.transferMember({
        groupId: sourceGroupId,
        borrowerId,
        targetGroupId,
        reason: reason.trim(),
        actorUserId: user!.id,
      }),
    onSuccess: async () => {
      toast.success('Borrower transferred', {
        message: 'Group membership and collector queues were updated.',
      });
      setPreview(null);
      setReason('');
      await invalidateOperationalQueries();
    },
    onError: (error) => {
      toast.error('Group reassignment failed', {
        message:
          error instanceof ApiError
            ? error.message
            : 'We could not transfer the borrower. Please try again.',
      });
    },
  });

  const collectorMutation = useMutation({
    mutationFn: () =>
      groupService.reassignCollector({
        groupId: collectorGroupId,
        collectorId,
        reason: reason.trim(),
        actorUserId: user!.id,
      }),
    onSuccess: async () => {
      toast.success('Collector reassigned', {
        message: 'Dashboards and work queues will refresh shortly.',
      });
      setPreview(null);
      setReason('');
      await invalidateOperationalQueries();
    },
    onError: (error) => {
      toast.error('Collector reassignment failed', {
        message:
          error instanceof ApiError
            ? error.message
            : 'We could not reassign the collector. Please try again.',
      });
    },
  });

  const paymentDayMutation = useMutation({
    mutationFn: () =>
      loanService.requestScheduleChange(loanId, {
        toPaymentDay,
        effectiveFrom,
        reason: reason.trim(),
      }),
    onSuccess: async () => {
      toast.success('Payment day change requested', {
        message: 'Approve the pending schedule change to recalculate future weeks.',
      });
      setPreview(null);
      setReason('');
      await invalidateOperationalQueries();
    },
    onError: (error) => {
      toast.error('Payment day change failed', {
        message:
          error instanceof ApiError
            ? error.message
            : 'We could not request the payment day change. Please try again.',
      });
    },
  });

  const sourceGroup = groups.find((group) => group.id === sourceGroupId);
  const targetGroup = groups.find((group) => group.id === targetGroupId);
  const collectorGroup = groups.find((group) => group.id === collectorGroupId);
  const selectedCollector = collectors.find((entry) => entry.id === collectorId);

  return (
    <div className="space-y-wilms-6">
      <div className="flex flex-wrap items-center justify-between gap-wilms-3">
        <div>
          <h1 className="text-h2 text-text-primary">Operational reassignment</h1>
          <p className="mt-wilms-1 text-small text-text-muted">
            Move borrowers between groups, reassign collectors, or change repayment weekdays with
            preview and audit logging.
          </p>
        </div>
        <Link
          href="/ops"
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-wilms-3 py-wilms-2 text-small font-medium text-text-primary hover:bg-background"
        >
          Back to Operations
        </Link>
      </div>

      <div className="flex flex-wrap gap-wilms-2">
        {(
          [
            ['group', 'Group reassignment'],
            ['collector', 'Collector reassignment'],
            ['payment-day', 'Payment day'],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            variant={tab === id ? 'primary' : 'secondary'}
            onClick={() => {
              setTab(id);
              setPreview(null);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'group' ? (
        <Card>
          <CardHeader>
            <CardTitle>Transfer borrower to another group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-wilms-4">
            <label className="block space-y-wilms-1 text-small">
              <span>Source group ID</span>
              <Select value={sourceGroupId} onChange={(event) => setSourceGroupId(event.target.value)}>
                <option value="">Select source group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupSystemId} — {group.displayName || group.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Borrower ID</span>
              <Input
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
                placeholder="Borrower UUID"
              />
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Target group</span>
              <Select value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}>
                <option value="">Select target group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupSystemId} — {group.displayName || group.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Reason</span>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
            </label>
            {preview ? <Alert title="Preview">{preview}</Alert> : null}
            <div className="flex flex-wrap gap-wilms-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!sourceGroupId || !targetGroupId || !borrowerId || !reason.trim()}
                onClick={() =>
                  setPreview(
                    `Move borrower ${borrowerId} from ${sourceGroup?.displayName || sourceGroupId} to ${targetGroup?.displayName || targetGroupId}. Membership, expected collections, and collector queues will update.`,
                  )
                }
              >
                Preview
              </Button>
              <Button
                type="button"
                disabled={
                  !user?.id ||
                  !preview ||
                  transferMutation.isPending ||
                  !sourceGroupId ||
                  !targetGroupId ||
                  !borrowerId ||
                  !reason.trim()
                }
                onClick={() => transferMutation.mutate()}
              >
                {transferMutation.isPending ? 'Transferring…' : 'Confirm transfer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'collector' ? (
        <Card>
          <CardHeader>
            <CardTitle>Reassign group collector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-wilms-4">
            <label className="block space-y-wilms-1 text-small">
              <span>Group</span>
              <Select
                value={collectorGroupId}
                onChange={(event) => setCollectorGroupId(event.target.value)}
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupSystemId} — {group.displayName || group.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>New collector</span>
              <Select value={collectorId} onChange={(event) => setCollectorId(event.target.value)}>
                <option value="">Select collector</option>
                {collectors.map((collector) => (
                  <option key={collector.id} value={collector.id}>
                    {collector.displayName}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Reason</span>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
            </label>
            {preview ? <Alert title="Preview">{preview}</Alert> : null}
            <div className="flex flex-wrap gap-wilms-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!collectorGroupId || !collectorId || !reason.trim()}
                onClick={() =>
                  setPreview(
                    `Assign ${selectedCollector?.displayName || collectorId} as collector for ${collectorGroup?.displayName || collectorGroupId}. Old and new collectors will be notified.`,
                  )
                }
              >
                Preview
              </Button>
              <Button
                type="button"
                disabled={
                  !user?.id ||
                  !preview ||
                  collectorMutation.isPending ||
                  !collectorGroupId ||
                  !collectorId ||
                  !reason.trim()
                }
                onClick={() => collectorMutation.mutate()}
              >
                {collectorMutation.isPending ? 'Reassigning…' : 'Confirm reassignment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'payment-day' ? (
        <Card>
          <CardHeader>
            <CardTitle>Change repayment weekday</CardTitle>
          </CardHeader>
          <CardContent className="space-y-wilms-4">
            <Alert title="Maker-checker">
              This creates a schedule-change request. Approving it recalculates future PENDING weeks
              while preserving historical payments.
            </Alert>
            <label className="block space-y-wilms-1 text-small">
              <span>Loan ID</span>
              <Input
                value={loanId}
                onChange={(event) => setLoanId(event.target.value)}
                placeholder="Loan UUID"
              />
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>New payment day</span>
              <Select value={toPaymentDay} onChange={(event) => setToPaymentDay(event.target.value)}>
                {PAYMENT_DAY_OPTIONS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Effective from</span>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Reason</span>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
            </label>
            {preview ? <Alert title="Preview">{preview}</Alert> : null}
            <div className="flex flex-wrap gap-wilms-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!loanId || !toPaymentDay || !effectiveFrom || !reason.trim()}
                onClick={() =>
                  setPreview(
                    `Request payment day ${toPaymentDay} for loan ${loanId} from ${effectiveFrom}. Future schedule weeks will move; paid and historical weeks stay unchanged.`,
                  )
                }
              >
                Preview
              </Button>
              <Button
                type="button"
                disabled={
                  !preview ||
                  paymentDayMutation.isPending ||
                  !loanId ||
                  !toPaymentDay ||
                  !effectiveFrom ||
                  !reason.trim()
                }
                onClick={() => paymentDayMutation.mutate()}
              >
                {paymentDayMutation.isPending ? 'Requesting…' : 'Confirm request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
