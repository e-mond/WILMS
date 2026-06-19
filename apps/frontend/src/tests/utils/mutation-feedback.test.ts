import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from '@/state/uiStore';
import { ApiError, API_ERROR_CODE } from '@/types/api';
import { TOAST_VARIANT } from '@/types/toast';
import {
  notifyMutationError,
  notifyMutationSuccess,
  resolveMutationErrorMessage,
} from '@/utils/mutation-feedback';

describe('mutation-feedback', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [], isMobileNavOpen: false });
  });

  it('resolves ApiError and Error messages', () => {
    expect(
      resolveMutationErrorMessage(
        new ApiError('Duplicate payment', API_ERROR_CODE.DUPLICATE_TRANSACTION),
        'Fallback',
      ),
    ).toBe('Duplicate payment');
    expect(resolveMutationErrorMessage(new Error('Network down'), 'Fallback')).toBe('Network down');
    expect(resolveMutationErrorMessage('unknown', 'Fallback')).toBe('Fallback');
  });

  it('queues success and error toasts', () => {
    notifyMutationSuccess('Saved', 'All good.');
    notifyMutationError('Failed', new Error('Boom'), 'Fallback');

    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0]?.variant).toBe(TOAST_VARIANT.ERROR);
    expect(toasts[0]?.title).toBe('Failed');
    expect(toasts[1]?.variant).toBe(TOAST_VARIANT.SUCCESS);
    expect(toasts[1]?.title).toBe('Saved');
  });
});
