'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DisbursementGateAlert } from '@/features/admin-fee/components/DisbursementGateAlert';
import { useAdminFeeStatus } from '@/features/admin-fee/hooks/useAdminFeeStatus';
import { useRecordAdminFee } from '@/features/admin-fee/hooks/useRecordAdminFee';
import { ApiError } from '@/types/api';

function AdminFeeDisbursementNotice({
  borrowerId,
  isPaid,
}: {
  borrowerId: string;
  isPaid: boolean;
}) {
  if (isPaid) {
    return (
      <>
        <Alert title="Disbursement unlocked" variant="success">
          Admin fee confirmed. This borrower is eligible for loan disbursement.
        </Alert>
        <PermissionGate permission={PERMISSION.APPROVE_LOANS}>
          <DisbursementGateAlert borrowerId={borrowerId} />
        </PermissionGate>
      </>
    );
  }

  return (
    <Alert title="Disbursement blocked" variant="warning">
      Admin fee must be recorded before loan disbursement.
    </Alert>
  );
}

export interface AdminFeeRecordingPanelProps {
  borrowerId: string;
}

export function AdminFeeRecordingPanel({ borrowerId }: AdminFeeRecordingPanelProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useAdminFeeStatus(borrowerId);
  const recordAdminFeeMutation = useRecordAdminFee(borrowerId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setActionError(null);

    try {
      await recordAdminFeeMutation.mutateAsync();
      setIsConfirmOpen(false);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'Unable to record admin fee. Please try again.',
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading admin fee details" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Borrower not found"
        description="This borrower could not be loaded for admin fee recording."
        action={
          <Button type="button" variant="secondary" onClick={() => router.push('/collector/admin-fee')}>
            Back to admin fee queue
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Required admin fee"
          value={<CurrencyAmount value={data.requiredAmountPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Fee status"
          value={data.isPaid ? 'Recorded' : 'Pending'}
        />
        <KpiCard
          variant="executive"
          label="Recorded by"
          value={data.recordedByCollectorName ?? '—'}
        />
      </ExecutiveKpiGrid>

      <ExecutiveDetailLayout
        sidebar={
          <DetailSidebarCard title={data.borrowerName}>
            <p className="text-small text-text-muted">
              Admin fee must be confirmed before loan disbursement.
            </p>
          </DetailSidebarCard>
        }
      >
        {actionError ? (
          <Alert title="Recording failed" variant="error">
          {actionError}
        </Alert>
      ) : null}

      {data.isPaid ? (
        <div className="space-y-wilms-4">
          <Alert title="Admin fee recorded" variant="success">
            Fee of <CurrencyAmount value={data.requiredAmountPesewas} /> was recorded
            {data.recordedByCollectorName ? ` by ${data.recordedByCollectorName}` : ''}.
          </Alert>
          <AdminFeeDisbursementNotice borrowerId={borrowerId} isPaid />
        </div>
      ) : (
        <div className="space-y-wilms-4">
          <AdminFeeDisbursementNotice borrowerId={borrowerId} isPaid={false} />
          <PermissionGate permission={PERMISSION.RECORD_COLLECTIONS}>
            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto"
              aria-label="Record admin fee"
              onClick={() => setIsConfirmOpen(true)}
            >
              Record admin fee
            </Button>
          </PermissionGate>
        </div>
      )}

      <Modal
        isOpen={isConfirmOpen}
        title="Record admin fee"
        onClose={() => setIsConfirmOpen(false)}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={recordAdminFeeMutation.isPending}
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <PermissionGate permission={PERMISSION.RECORD_COLLECTIONS}>
              <Button
                type="button"
                variant="primary"
                disabled={recordAdminFeeMutation.isPending}
                aria-label="Confirm admin fee recording"
                onClick={() => void handleConfirm()}
              >
                {recordAdminFeeMutation.isPending ? 'Saving...' : 'Confirm'}
              </Button>
            </PermissionGate>
          </>
        }
      >
        <p className="text-body text-text-muted">
          Confirm that <strong>{data.borrowerName}</strong> has paid the admin fee of{' '}
          <CurrencyAmount value={data.requiredAmountPesewas} />. This will unlock loan disbursement.
        </p>
      </Modal>
      </ExecutiveDetailLayout>
    </div>
  );
}
