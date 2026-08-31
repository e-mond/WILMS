'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PAYMENT_DAY_OPTIONS } from '@/constants/loan';
import { PERMISSION } from '@/constants/permissions';
import { PendingScheduleChangeQueue } from '@/features/ops/components/PendingScheduleChangeQueue';
import { useCollectorsManagement } from '@/features/collector-management/hooks/useCollectorsManagement';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService, loanService } from '@/services';
import { ApiError } from '@/types/api';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';

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
  const [borrowerQuery, setBorrowerQuery] = useState('');
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

  const sourceGroupDetailQuery = useQuery({
    queryKey: ['groups', 'ops-reassignment', sourceGroupId],
    queryFn: () => groupService.getGroup(sourceGroupId),
    enabled: Boolean(sourceGroupId),
  });

  const activeLoansQuery = useQuery({
    queryKey: ['loans', 'ops-reassignment', 'portfolio'],
    queryFn: () => loanService.listPortfolioEntries(),
    enabled: tab === 'payment-day',
  });

  const sourceMembers = sourceGroupDetailQuery.data?.members ?? [];
  const normalizedBorrowerQuery = borrowerQuery.trim().toLowerCase();
  const borrowerSuggestions = useMemo(() => {
    if (!normalizedBorrowerQuery) {
      return sourceMembers.slice(0, 8);
    }
    return sourceMembers
      .filter((member) => {
        const displayId = resolveBorrowerDisplayId({
          id: member.borrowerId,
          displayId: member.displayId,
        }).toLowerCase();
        return (
          member.fullName.toLowerCase().includes(normalizedBorrowerQuery) ||
          displayId.includes(normalizedBorrowerQuery) ||
          member.borrowerId.toLowerCase().includes(normalizedBorrowerQuery)
        );
      })
      .slice(0, 8);
  }, [normalizedBorrowerQuery, sourceMembers]);

  const selectedBorrower = sourceMembers.find((member) => member.borrowerId === borrowerId);
  const selectedBorrowerLabel = selectedBorrower
    ? `${resolveBorrowerDisplayId({
        id: selectedBorrower.borrowerId,
        displayId: selectedBorrower.displayId,
      })} — ${selectedBorrower.fullName}`
    : borrowerId;

  const activeLoans = useMemo(
    () => (activeLoansQuery.data ?? []).filter((loan) => loan.status === 'ACTIVE'),
    [activeLoansQuery.data],
  );
  const selectedLoan = activeLoans.find((loan) => loan.id === loanId);
  const selectedLoanLabel = selectedLoan
    ? `${resolveLoanDisplayId(selectedLoan)}${selectedLoan.borrowerName ? ` — ${selectedLoan.borrowerName}` : ''}`
    : loanId;

  const invalidateOperationalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['groups'] }),
      queryClient.invalidateQueries({ queryKey: ['borrowers'] }),
      queryClient.invalidateQueries({ queryKey: ['loans'] }),
      queryClient.invalidateQueries({ queryKey: ['loan-schedule-changes'] }),
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
              <span>Source group</span>
              <Select
                value={sourceGroupId}
                onChange={(event) => {
                  setSourceGroupId(event.target.value);
                  setBorrowerId('');
                  setBorrowerQuery('');
                  setPreview(null);
                }}
              >
                <option value="">Select source group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupSystemId} — {group.displayName || group.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-wilms-1 text-small">
              <span>Borrower</span>
              <Input
                value={borrowerQuery}
                onChange={(event) => {
                  setBorrowerQuery(event.target.value);
                  setBorrowerId('');
                  setPreview(null);
                }}
                placeholder={
                  sourceGroupId
                    ? 'Search by name or BRW-… ID'
                    : 'Select a source group first'
                }
                disabled={!sourceGroupId}
                list="ops-reassignment-borrowers"
                autoComplete="off"
              />
              <datalist id="ops-reassignment-borrowers">
                {borrowerSuggestions.map((member) => {
                  const displayId = resolveBorrowerDisplayId({
                    id: member.borrowerId,
                    displayId: member.displayId,
                  });
                  return (
                    <option
                      key={member.borrowerId}
                      value={`${displayId} — ${member.fullName}`}
                    />
                  );
                })}
              </datalist>
              {sourceGroupId && borrowerSuggestions.length > 0 ? (
                <ul className="mt-wilms-1 max-h-40 overflow-auto rounded-md border border-border bg-card">
                  {borrowerSuggestions.map((member) => {
                    const displayId = resolveBorrowerDisplayId({
                      id: member.borrowerId,
                      displayId: member.displayId,
                    });
                    const label = `${displayId} — ${member.fullName}`;
                    return (
                      <li key={member.borrowerId}>
                        <button
                          type="button"
                          className="w-full px-wilms-3 py-wilms-2 text-left text-small hover:bg-background"
                          onClick={() => {
                            setBorrowerId(member.borrowerId);
                            setBorrowerQuery(label);
                            setPreview(null);
                          }}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {sourceGroupId && sourceMembers.length === 0 && !sourceGroupDetailQuery.isLoading ? (
                <p className="text-small text-text-muted">No members found in this group.</p>
              ) : null}
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
                    `Move ${selectedBorrowerLabel} from ${sourceGroup?.displayName || sourceGroupId} to ${targetGroup?.displayName || targetGroupId}. Membership, expected collections, and collector queues will update.`,
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
        <div className="space-y-wilms-4">
          <Card>
            <CardHeader>
              <CardTitle>Change repayment weekday</CardTitle>
            </CardHeader>
            <CardContent className="space-y-wilms-4">
              <Alert title="Maker-checker">
                This creates a schedule-change request. A different authorised reviewer must review
                or approve it before future PENDING weeks are recalculated.
              </Alert>
              <label className="block space-y-wilms-1 text-small">
                <span>Loan</span>
                <Select value={loanId} onChange={(event) => setLoanId(event.target.value)}>
                  <option value="">Select active loan</option>
                  {activeLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {resolveLoanDisplayId(loan)}
                      {loan.borrowerName ? ` — ${loan.borrowerName}` : ''}
                    </option>
                  ))}
                </Select>
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
                      `Request payment day ${toPaymentDay} for ${selectedLoanLabel} from ${effectiveFrom}. Future schedule weeks will move; paid and historical weeks stay unchanged.`,
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

          <PermissionGate
            permissions={[PERMISSION.APPROVE_BORROWERS, PERMISSION.MANAGE_SYSTEM_SETTINGS]}
          >
            <Card>
              <CardHeader>
                <CardTitle>Review pending requests</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingScheduleChangeQueue />
              </CardContent>
            </Card>
          </PermissionGate>
        </div>
      ) : null}
    </div>
  );
}
