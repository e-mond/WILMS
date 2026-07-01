import {
  Avatar,
  CurrencyAmount,
  Sparkline,
} from '@/components/data-display';
import { CollectorStreakIcon } from '@/components/icons/CollectorStreakIcon';
import type { CollectorSummary } from '@/types/collector-management';
import { collectorRateTextClass } from '@/utils/collector-rate-display';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { resolveCollectorDisplayId } from '@/utils/entity-display-id';
import { cn } from '@/utils/cn';

export interface CollectorsMobileCardListProps {
  collectors: CollectorSummary[];
  selectedId?: string | null;
  onSelect: (collectorId: string) => void;
}

function statusLabel(status: CollectorSummary['status']): string {
  return status === 'ACTIVE' ? 'Active' : 'Away';
}

export function CollectorsMobileCardList({
  collectors,
  selectedId,
  onSelect,
}: CollectorsMobileCardListProps) {
  return (
    <ul className="grid gap-wilms-3 lg:hidden" aria-label="Collectors">
      {collectors.map((collector) => (
        <li key={collector.id}>
          <button
            type="button"
            onClick={() => onSelect(collector.id)}
            className={cn(
              'relative w-full rounded-sm border bg-card p-wilms-4 text-left transition-colors',
              selectedId === collector.id
                ? 'border-executive-gold ring-1 ring-executive-gold/30'
                : 'border-border hover:border-brand-primary/40',
            )}
          >
            {selectedId === collector.id ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-[3px] rounded-l-sm bg-executive-gold"
              />
            ) : null}
            <div className="flex items-start justify-between gap-wilms-3">
              <div className="flex min-w-0 flex-1 items-center gap-wilms-3">
                <Avatar
                  label={collector.displayName}
                  photoUrl={resolveEntityPhotoUrl({
                    name: collector.displayName,
                    id: collector.id,
                    photoUrl: collector.photoUrl,
                  })}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">{collector.displayName}</p>
                  <p className="text-small font-semibold text-executive-gold">
                    {resolveCollectorDisplayId(collector)}
                  </p>
                  <p className="mt-wilms-1 truncate text-small text-text-muted">{collector.zone}</p>
                </div>
              </div>
              <span className="shrink-0 text-small font-semibold text-text-muted">
                {statusLabel(collector.status)}
              </span>
            </div>
            <dl className="mt-wilms-3 grid grid-cols-2 gap-wilms-2 text-small">
              <div>
                <dt className="text-text-muted">Groups</dt>
                <dd className="font-semibold text-text-primary">{collector.groupCount}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Borrowers</dt>
                <dd className="font-semibold text-text-primary">{collector.borrowerCount}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Expected</dt>
                <dd className="font-semibold">
                  <CurrencyAmount value={collector.expectedPesewas} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Collected</dt>
                <dd className="font-semibold text-status-active">
                  <CurrencyAmount value={collector.collectedPesewas} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Rate</dt>
                <dd className={collectorRateTextClass(collector.collectionRatePercent)}>
                  {collector.collectionRatePercent}%
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Streak</dt>
                <dd>
                  {collector.streakWeeks > 0 ? (
                    <span className="inline-flex items-center gap-wilms-1 font-semibold text-executive-gold">
                      <CollectorStreakIcon />
                      {collector.streakWeeks}w
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-wilms-3 flex items-center justify-between gap-wilms-2">
              <span className="text-small text-text-muted">Trend</span>
              <Sparkline values={collector.rateTrend} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
