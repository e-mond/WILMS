import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';

describe('OfflineBanner', () => {
  it('announces offline state to screen readers', () => {
    render(
      <OfflineBanner
        isOffline
        pendingCount={0}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'You are offline. Payments will be saved and synced when connection returns.',
    );
  });

  it('shows critical warning when queue threshold exceeded', () => {
    render(
      <OfflineBanner
        isOffline={false}
        pendingCount={100}
        isSyncing={false}
        hasQueueWarning
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Sync backlog critical');
  });

  it('renders nothing when online with empty queue', () => {
    const { container } = render(
      <OfflineBanner
        isOffline={false}
        pendingCount={0}
        isSyncing={false}
        hasQueueWarning={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
