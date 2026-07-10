'use client';

import { useMutation } from '@tanstack/react-query';
import { expenseService } from '@/services';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import type { CreateExpenseInput } from '@/types/expense';
import {
  notifyMutationError,
  notifyMutationInfo,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export interface RecordExpenseOrQueueVariables extends CreateExpenseInput {
  isOffline: boolean;
}

export interface RecordExpenseOrQueueResult {
  mode: 'online' | 'offline';
  queueItemId?: string;
}

export function useRecordExpenseOrQueue() {
  const enqueueExpense = useOfflineQueueStore((state) => state.enqueueExpense);

  return useMutation({
    mutationFn: async ({
      isOffline,
      ...payload
    }: RecordExpenseOrQueueVariables): Promise<RecordExpenseOrQueueResult> => {
      if (isOffline) {
        const item = enqueueExpense(payload);
        return { mode: 'offline', queueItemId: item.id };
      }

      await expenseService.createExpense(payload);
      return { mode: 'online' };
    },
    onSuccess: (result) => {
      if (result.mode === 'offline') {
        notifyMutationInfo('Expense saved offline', 'It will sync when connection returns.');
        return;
      }

      notifyMutationSuccess('Expense submitted', 'Your expense is pending admin approval.');
    },
    onError: (error) => {
      notifyMutationError('Expense submission failed', error, 'Unable to record expense.');
    },
  });
}
