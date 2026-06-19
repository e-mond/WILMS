'use client';

import { Alert } from '@/components/feedback/Alert';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useDisbursementEligibility } from '@/features/admin-fee/hooks/useDisbursementEligibility';

export interface DisbursementGateAlertProps {
  borrowerId: string;
}

export function DisbursementGateAlert({ borrowerId }: DisbursementGateAlertProps) {
  const { data, isLoading } = useDisbursementEligibility(borrowerId);

  if (isLoading) {
    return <LoadingSpinner label="Checking disbursement eligibility" className="py-wilms-4" />;
  }

  if (!data) {
    return null;
  }

  if (data.canDisburse) {
    return (
      <Alert title="Disbursement unlocked" variant="success">
        Admin fee confirmed. This borrower is eligible for loan disbursement.
      </Alert>
    );
  }

  return (
    <Alert title="Disbursement blocked" variant="warning">
      {data.reason ?? 'Admin fee must be recorded before loan disbursement.'}
    </Alert>
  );
}
