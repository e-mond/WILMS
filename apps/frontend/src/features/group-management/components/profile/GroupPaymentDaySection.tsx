'use client';

import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Alert } from '@/components/feedback/Alert';
import { ProfileSection } from '@/components/layout/executive/ProfileSection';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PAYMENT_DAY_OPTIONS } from '@/constants/loan';
import { PERMISSION } from '@/constants/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService } from '@/services';
import type { GroupDetail } from '@/types/group-detail';

export interface GroupPaymentDaySectionProps {
  group: GroupDetail;
  onUpdated: () => void;
}

export function GroupPaymentDaySection({ group, onUpdated }: GroupPaymentDaySectionProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [paymentDay, setPaymentDay] = useState(group.paymentDay ?? 'Tuesday');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPaymentDay(group.paymentDay ?? 'Tuesday');
  }, [group.paymentDay]);

  async function handleSave() {
    if (!user || !paymentDay || paymentDay === group.paymentDay) {
      return;
    }

    setIsSubmitting(true);

    try {
      await groupService.updatePaymentDay({
        groupId: group.id,
        paymentDay,
        actorUserId: user.id,
      });
      toast.success('Collection day updated', {
        message: `${group.displayName} now collects on ${paymentDay}.`,
      });
      onUpdated();
    } catch (error) {
      toast.error('Unable to update collection day', {
        message: error instanceof Error ? error.message : 'Try again shortly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
      <ProfileSection title="Collection day">
        {!group.paymentDay ? (
          <Alert title="Collection day required" variant="warning" className="mb-wilms-3">
            Every group must have one weekday for collections. All members repay on the same day.
            Assign a day before disbursing new loans to this group.
          </Alert>
        ) : (
          <p className="text-body text-text-muted">
            All members in this group must repay on <strong>{group.paymentDay}</strong>. New loans
            cannot use a different payment day while the borrower remains in this group.
          </p>
        )}
        <div className="mt-wilms-3 flex flex-col gap-wilms-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="group-payment-day" className="text-small font-semibold text-text-primary">
              Weekly collection day
            </label>
            <Select
              id="group-payment-day"
              value={paymentDay}
              onChange={(event) => setPaymentDay(event.target.value)}
              aria-label="Group collection day"
              className="mt-wilms-1"
            >
              {PAYMENT_DAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !paymentDay || paymentDay === (group.paymentDay ?? '')}
            onClick={() => void handleSave()}
          >
            {group.paymentDay ? 'Update collection day' : 'Assign collection day'}
          </Button>
        </div>
      </ProfileSection>
    </PermissionGate>
  );
}
