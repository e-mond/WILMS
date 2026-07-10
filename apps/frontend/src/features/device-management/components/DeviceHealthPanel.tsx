'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert } from '@/components/feedback/Alert';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { useBatteryStatus } from '@/hooks/useBatteryStatus';
import { useStorageEstimate } from '@/hooks/useStorageEstimate';
import { estimatePendingUploadBytes, listPendingUploads } from '@/lib/offline-queue/upload-queue';
import { selectPendingQueueCount, useOfflineQueueStore } from '@/state/offlineQueueStore';
import { SettingsDeviceIcon } from '@/features/settings/components/SettingsSectionIcons';
import { formatBytesLabel } from '@/utils/format-bytes';

export function DeviceHealthPanel() {
  const battery = useBatteryStatus();
  const storage = useStorageEstimate();
  const queueItems = useOfflineQueueStore((state) => state.items);
  const pendingOps = selectPendingQueueCount(queueItems);
  const [pendingUploadBytes, setPendingUploadBytes] = useState(0);

  const uploadQuery = useQuery({
    queryKey: ['device', 'pending-uploads'],
    queryFn: listPendingUploads,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    void estimatePendingUploadBytes().then(setPendingUploadBytes);
  }, [uploadQuery.dataUpdatedAt]);

  const batteryLabel =
    battery.level !== null ? `${Math.round(battery.level * 100)}%` : 'Unavailable';
  const batteryMode = battery.savingMode ? 'Battery saver active' : 'Normal power';

  return (
    <SettingsSectionCard
      title="Device health"
      description="Storage, battery, and pending field operations on this device."
      icon={<SettingsDeviceIcon />}
    >
      {storage.critical ? (
        <Alert title="Storage almost full" variant="warning">
          Local cache is at {storage.percentUsed}% capacity. Sync or clear pending uploads before
          capturing more photos offline.
        </Alert>
      ) : null}

      <dl className="mt-wilms-4 grid gap-wilms-3 sm:grid-cols-2">
        <div>
          <dt className="text-small text-text-muted">Battery</dt>
          <dd className="font-semibold text-text-primary">
            {batteryLabel} · {batteryMode}
          </dd>
        </div>
        <div>
          <dt className="text-small text-text-muted">Local storage</dt>
          <dd className="font-semibold text-text-primary">
            {storage.usageLabel}
            {storage.percentUsed !== null ? ` (${storage.percentUsed}% of ${storage.quotaLabel})` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-small text-text-muted">Offline operations queue</dt>
          <dd className="font-semibold text-text-primary">{pendingOps} pending</dd>
        </div>
        <div>
          <dt className="text-small text-text-muted">Pending uploads</dt>
          <dd className="font-semibold text-text-primary">
            {uploadQuery.data?.length ?? 0} files · {formatBytesLabel(pendingUploadBytes)}
          </dd>
        </div>
      </dl>
    </SettingsSectionCard>
  );
}
