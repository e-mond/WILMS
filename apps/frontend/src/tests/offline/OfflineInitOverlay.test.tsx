import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { OfflineInitOverlay } from '@/components/offline/OfflineInitOverlay';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { OFFLINE_QUEUE_ITEM_STATUS, OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';

describe('OfflineInitOverlay', () => {
  beforeEach(() => {
    useOfflineQueueStore.setState({
      items: [],
      syncState: 'idle',
    });
  });

  it('renders nothing when not syncing', () => {
    const { container } = render(<OfflineInitOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows sync splash while queue drains', () => {
    useOfflineQueueStore.setState({
      syncState: 'syncing',
      items: [
        {
          id: 'queue-1',
          type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT,
          payload: {
            borrowerId: 'borrower-1',
            amountPesewas: 5000,
            paymentDate: '2026-01-01',
            collectorId: 'user-collector',
            gps: { latitude: 1, longitude: 1, accuracy: 5, capturedAt: '2026-01-01T00:00:00.000Z' },
          },
          status: OFFLINE_QUEUE_ITEM_STATUS.PENDING,
          createdAt: Date.now(),
          lastAttemptAt: null,
          attemptCount: 0,
          lastError: null,
        },
      ],
    });

    render(<OfflineInitOverlay />);

    expect(screen.getByLabelText('Syncing 1 queued item...')).toBeInTheDocument();
  });
});
