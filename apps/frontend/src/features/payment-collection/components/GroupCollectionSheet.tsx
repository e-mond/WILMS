'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, CurrencyAmount, DataTable } from '@/components/data-display';
import { Button } from '@/components/ui/Button';
import { useCollectorDashboard } from '@/features/payment-collection/hooks/useCollectorDashboard';
import { useAuth } from '@/hooks/useAuth';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import { resolveGroupDisplayId } from '@/utils/entity-display-id';

export interface GroupCollectionSheetProps {
  groupId: string;
}

type MemberPaymentChoice = 'PAID' | 'MISSED' | 'UNSET';

interface SheetMember {
  borrowerId: string;
  borrowerName: string;
  expectedPesewas: number;
  choice: MemberPaymentChoice;
}

export function GroupCollectionSheet({ groupId }: GroupCollectionSheetProps) {
  const { user } = useAuth();
  const { data, isLoading } = useCollectorDashboard(user?.id);
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [paymentType, setPaymentType] = useState<
    'NORMAL' | 'DOUBLE' | 'PARTIAL' | 'ADVANCE'
  >('NORMAL');
  const [submitted, setSubmitted] = useState(false);

  const group = data?.todayGroups.find((entry) => entry.groupId === groupId);

  const sheetMembers = useMemo(() => {
    if (members.length > 0) {
      return members;
    }

    return (data?.borrowers ?? []).slice(0, 8).map((borrower) => ({
      borrowerId: borrower.borrowerId,
      borrowerName: borrower.borrowerName,
      expectedPesewas: borrower.expectedPesewas,
      choice: 'UNSET' as MemberPaymentChoice,
    }));
  }, [data?.borrowers, members]);

  const setChoice = (borrowerId: string, choice: MemberPaymentChoice) => {
    setMembers(
      sheetMembers.map((member) =>
        member.borrowerId === borrowerId ? { ...member, choice } : member,
      ),
    );
  };

  const handleSubmitAll = () => {
    setSubmitted(true);
  };

  if (isLoading || !data) {
    return <p className="text-body text-text-muted">Loading group collection sheet...</p>;
  }

  return (
    <div className="space-y-wilms-4">
      <div className="flex flex-wrap items-center justify-between gap-wilms-3">
        <div>
          <Link href="/collector/dashboard" className="text-small font-semibold text-brand-primary hover:underline">
            Back to dashboard
          </Link>
          <h1 className="mt-wilms-2 text-heading-2 font-semibold text-text-primary">
            {group?.groupName ?? 'Group Collection Sheet'}
          </h1>
          <p className="text-small text-text-muted">
            {group?.community ?? 'Assigned group'} · {resolveGroupDisplayId({ id: groupId })}
          </p>
        </div>
        <div className="flex flex-wrap gap-wilms-2">
          {(['NORMAL', 'DOUBLE', 'PARTIAL', 'ADVANCE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-sm border px-wilms-3 py-wilms-2 text-small font-semibold ${
                paymentType === type
                  ? 'border-brand-primary bg-brand-primary text-card'
                  : 'border-border text-text-primary'
              }`}
              onClick={() => setPaymentType(type)}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        variant="executive"
        caption="Group members"
        data={sheetMembers}
        getRowId={(row) => row.borrowerId}
        columns={[
          {
            id: 'member',
            header: 'Member',
            cell: (row) => (
              <div className="flex items-center gap-wilms-3">
                <Avatar
                  label={row.borrowerName}
                  photoUrl={resolvePersonPhotoUrl({ name: row.borrowerName, id: row.borrowerId })}
                  size="sm"
                />
                <span className="font-semibold">{row.borrowerName}</span>
              </div>
            ),
          },
          {
            id: 'expected',
            header: 'Expected',
            cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
          },
          {
            id: 'choice',
            header: 'Mark payment',
            cell: (row) => (
              <div className="flex gap-wilms-2">
                <Button
                  type="button"
                  size="sm"
                  variant={row.choice === 'PAID' ? 'primary' : 'secondary'}
                  onClick={() => setChoice(row.borrowerId, 'PAID')}
                >
                  Paid
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={row.choice === 'MISSED' ? 'danger' : 'secondary'}
                  onClick={() => setChoice(row.borrowerId, 'MISSED')}
                >
                  Missed
                </Button>
              </div>
            ),
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-wilms-3">
        <Button type="button" variant="primary" onClick={handleSubmitAll}>
          Record all payments
        </Button>
        {submitted ? (
          <p className="text-small font-semibold text-status-active">
            Recorded {sheetMembers.filter((member) => member.choice === 'PAID').length} paid ·{' '}
            {sheetMembers.filter((member) => member.choice === 'MISSED').length} missed ·{' '}
            {paymentType.toLowerCase()} payment mode
          </p>
        ) : null}
      </div>
    </div>
  );
}
