'use client';

import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { ProfileSection } from '@/components/layout/executive/ProfileSection';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PERMISSION } from '@/constants/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService } from '@/services';
import type { GroupDetail } from '@/types/group-detail';

export interface GroupDisplayNameSectionProps {
  group: GroupDetail;
  onUpdated: () => void;
}

export function GroupDisplayNameSection({ group, onUpdated }: GroupDisplayNameSectionProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(group.displayName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDisplayName(group.displayName);
  }, [group.displayName]);

  async function handleSave() {
    const trimmed = displayName.trim();

    if (!trimmed || !user || trimmed === group.displayName) {
      return;
    }

    setIsSubmitting(true);

    try {
      await groupService.updateDisplayName({
        groupId: group.id,
        displayName: trimmed,
        actorUserId: user.id,
      });
      toast.success('Display name updated', {
        message: `${group.groupSystemId} now shows as ${trimmed}.`,
      });
      onUpdated();
    } catch {
      toast.error('Unable to update display name', { message: 'Try again shortly.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
      <ProfileSection title="Group Display Name">
        <p className="text-body text-text-muted">
          The system ID ({group.groupSystemId}) is immutable. You can edit the display name shown
          in lists and exports.
        </p>
        <div className="mt-wilms-3 flex flex-col gap-wilms-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="group-display-name" className="text-small font-semibold text-text-primary">
              Display name
            </label>
            <Input
              id="group-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-label="Group display name"
              className="mt-wilms-1"
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !displayName.trim() || displayName.trim() === group.displayName}
            onClick={() => void handleSave()}
          >
            Save display name
          </Button>
        </div>
      </ProfileSection>
    </PermissionGate>
  );
}
