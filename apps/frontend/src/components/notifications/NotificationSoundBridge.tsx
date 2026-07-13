'use client';

import { useEffect, useRef } from 'react';
import { useNotificationInbox, useNotificationUnreadCount } from '@/features/notifications/hooks/useNotificationInbox';
import {
  areNotificationSoundsEnabled,
  playLoanDecisionSound,
  playMessageSound,
  playSecurityAlertSound,
} from '@/hooks/useNotificationSound';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

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
  }
}

export function NotificationSoundBridge() {
  const toast = useToast();
  const { isAuthenticated, isHydrated } = useAuth();
  const enabled = isHydrated && isAuthenticated;
  const pollInterval = enabled ? 15_000 : undefined;
  const { data: unreadCount = 0 } = useNotificationUnreadCount(enabled, pollInterval);
  const { data: inbox = [] } = useNotificationInbox(enabled, pollInterval);
  const previousCountRef = useRef<number | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!inbox.length) {
      return;
    }

    for (const item of inbox) {
      if (seenIdsRef.current.has(item.id)) {
        continue;
      }

      seenIdsRef.current.add(item.id);

      if (previousCountRef.current === null) {
        continue;
      }

      playForEvent(item.event);
      if (/COMMUNICATION|MESSAGE/i.test(item.event)) {
        toast.info(item.title, { message: item.body });
      }
    }
  }, [inbox, toast]);

  useEffect(() => {
    if (previousCountRef.current === null) {
      previousCountRef.current = unreadCount;
      return;
    }

    previousCountRef.current = unreadCount;
  }, [unreadCount]);

  return null;
}
