import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from '@/components/feedback/Toast';
import { ToastContainer } from '@/components/feedback/ToastContainer';
import { useUiStore } from '@/state/uiStore';
import { TOAST_VARIANT } from '@/types/toast';

describe('Toast', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [], isMobileNavOpen: false });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders success toast with status role', () => {
    render(
      <Toast
        toast={{
          id: 'toast-1',
          variant: TOAST_VARIANT.SUCCESS,
          title: 'Payment recorded',
          message: 'Receipt saved.',
          durationMs: 0,
          createdAt: Date.now(),
        }}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Payment recorded');
    expect(screen.getByText('Receipt saved.')).toBeInTheDocument();
  });

  it('renders error toast with alert role', () => {
    render(
      <Toast
        toast={{
          id: 'toast-2',
          variant: TOAST_VARIANT.ERROR,
          title: 'Sync failed',
          durationMs: 0,
          createdAt: Date.now(),
        }}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Sync failed');
  });

  it('auto-dismisses after duration', () => {
    const onDismiss = vi.fn();

    render(
      <Toast
        toast={{
          id: 'toast-3',
          variant: TOAST_VARIANT.INFO,
          title: 'Saved',
          durationMs: 2_000,
          createdAt: Date.now(),
        }}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(onDismiss).toHaveBeenCalledWith('toast-3');
  });
});

describe('ToastContainer', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [], isMobileNavOpen: false });
  });

  it('renders queued toasts from uiStore', () => {
    useUiStore.getState().addToast({
      variant: TOAST_VARIANT.WARNING,
      title: 'Queue backlog',
      message: 'Contact supervisor.',
      durationMs: 0,
    });

    render(<ToastContainer />);

    expect(screen.getByRole('status')).toHaveTextContent('Queue backlog');
  });

  it('dismisses toast when dismiss button is clicked', async () => {
    const user = userEvent.setup();

    useUiStore.getState().addToast({
      variant: TOAST_VARIANT.SYNC,
      title: 'Syncing payments',
      durationMs: 0,
    });

    render(<ToastContainer />);

    await user.click(screen.getByRole('button', { name: /Dismiss Syncing payments notification/ }));

    expect(useUiStore.getState().toasts).toHaveLength(0);
  });
});
