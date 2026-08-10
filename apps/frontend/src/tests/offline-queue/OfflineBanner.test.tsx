import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';

describe('OfflineBanner', () => {
  it('announces offline state to screen readers', () => {
    render(
      <OfflineBanner
        isOffline
        pendingPayments={0}
        pendingExpenses={0}
        reviewPayments={0}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'You are offline. WILMS is using locally stored data; new changes will sync automatically when you reconnect.',
    );
  });

  it('mentions pending items while offline', () => {
    render(
      <OfflineBanner
        isOffline
        pendingPayments={1}
        pendingExpenses={1}
        reviewPayments={0}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'You are offline. 1 payment, 1 expense saved on this device',
    );
  });

  it('shows critical warning when queue threshold exceeded', () => {
    render(
      <OfflineBanner
        isOffline={false}
        pendingPayments={100}
        pendingExpenses={0}
        reviewPayments={0}
        isSyncing={false}
        hasQueueWarning
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Sync backlog critical');
  });

  it('shows approver review message when payments are queued for review', () => {
    render(
      <OfflineBanner
        isOffline={false}
        pendingPayments={0}
        pendingExpenses={0}
        reviewPayments={2}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('2 payments awaiting approver review');
  });

  it('mentions pending expenses in sync messaging', () => {
    render(
      <OfflineBanner
        isOffline={false}
        pendingPayments={1}
        pendingExpenses={2}
        reviewPayments={0}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('1 payment, 2 expenses waiting to sync.');
  });

  it('renders nothing when online with empty queue', () => {
    const { container } = render(
      <OfflineBanner
        isOffline={false}
        pendingPayments={0}
        pendingExpenses={0}
        reviewPayments={0}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
