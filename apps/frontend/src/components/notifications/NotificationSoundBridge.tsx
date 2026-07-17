'use client';

import { useEffect, useRef } from 'react';
import { useNotificationInbox, useNotificationUnreadCount } from '@/features/notifications/hooks/useNotificationInbox';
import {
  areNotificationSoundsEnabled,
  playLoanDecisionSound,
  playMessageSound,
  playNotificationSound,
  playSecurityAlertSound,
} from '@/hooks/useNotificationSound';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  clearSeenNotificationIds,
  loadSeenNotificationIds,
  persistSeenNotificationIds,
} from '@/utils/notification-toast-tracker';

function playForEvent(event: string): void {
  if (!areNotificationSoundsEnabled()) {
    return;
  }

  if (/COMMUNICATION|MESSAGE/i.test(event)) {
    playMessageSound();
    return;
  }

  if (/LOAN_APPROVED|LOAN_REJECTED|REGISTRATION_APPROVED|REGISTRATION_REJECTED/i.test(event)) {
    playLoanDecisionSound(/REJECTED/i.test(event));
    return;
  }

  if (/LOGIN|PASSWORD|SECURITY|SUPERVISOR|DISABLED|BLACKLIST/i.test(event)) {
    playSecurityAlertSound();
    return;
  }

  // All other in-app notifications (expenses, reconciliation, assignments, etc.)
  playNotificationSound();
}

export function NotificationSoundBridge() {
  const toast = useToast();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const enabled = isHydrated && isAuthenticated;
  const userId = user?.id;
  const pollInterval = enabled ? 15_000 : undefined;
  useNotificationUnreadCount(enabled, pollInterval);
  const { data: inbox = [] } = useNotificationInbox(enabled, pollInterval);
  const baselineReadyRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    baselineReadyRef.current = false;
    seenIdsRef.current = new Set();

    if (userId) {
      seenIdsRef.current = loadSeenNotificationIds(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled) {
      baselineReadyRef.current = false;
      if (userId) {
        clearSeenNotificationIds(userId);
      }
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId || inbox.length === 0) {
      return;
    }

    if (!baselineReadyRef.current) {
      for (const item of inbox) {
        seenIdsRef.current.add(item.id);
      }
      persistSeenNotificationIds(userId, seenIdsRef.current);
      baselineReadyRef.current = true;
      return;
    }

    for (const item of inbox) {
      if (seenIdsRef.current.has(item.id)) {
        continue;
      }

      seenIdsRef.current.add(item.id);
      persistSeenNotificationIds(userId, seenIdsRef.current);

      playForEvent(item.event);
      if (/COMMUNICATION|MESSAGE/i.test(item.event)) {
        toast.info(item.title, {
          message: item.body,
          dedupeKey: `notification:${item.id}`,
        });
      }
    }
  }, [enabled, inbox, toast, userId]);

  return null;
}
