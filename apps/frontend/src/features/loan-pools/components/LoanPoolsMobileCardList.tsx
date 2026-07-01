import { CurrencyAmount, UtilisationBar } from '@/components/data-display';
import type { LoanPoolSummary } from '@/types/loan-pool';
import { cn } from '@/utils/cn';
import { resolvePoolDisplayId } from '@/utils/entity-display-id';

export interface LoanPoolsMobileCardListProps {
  pools: LoanPoolSummary[];
  selectedId?: string | null;
  onSelect: (poolId: string) => void;
}

export function LoanPoolsMobileCardList({
  pools,
  selectedId,
  onSelect,
}: LoanPoolsMobileCardListProps) {
  return (
    <ul className="grid gap-wilms-3 lg:hidden" aria-label="Loan pools">
      {pools.map((pool) => (
        <li key={pool.id}>
          <button
            type="button"
            onClick={() => onSelect(pool.id)}
            className={cn(
              'relative w-full rounded-sm border bg-card p-wilms-4 text-left transition-colors',
              selectedId === pool.id
                ? 'border-executive-gold ring-1 ring-executive-gold/30'
                : 'border-border hover:border-brand-primary/40',
            )}
          >
            {selectedId === pool.id ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-[3px] rounded-l-sm bg-executive-gold"
              />
            ) : null}
            <div className="flex items-start justify-between gap-wilms-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{pool.name}</p>
                <p className="text-small font-semibold text-executive-gold">{resolvePoolDisplayId(pool)}</p>
                <p className="mt-wilms-1 truncate text-small text-text-muted">
                  {pool.region} · {pool.source}
                </p>
              </div>
              <span className="shrink-0 text-small font-semibold text-text-muted">{pool.status}</span>
            </div>
            <dl className="mt-wilms-3 grid grid-cols-2 gap-wilms-2 text-small">
              <div>
                <dt className="text-text-muted">Capital</dt>
                <dd className="font-semibold text-brand-primary">
                  <CurrencyAmount value={pool.capitalPesewas} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Disbursed</dt>
                <dd className="font-semibold">
                  <CurrencyAmount value={pool.disbursedPesewas} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Collected</dt>
                <dd className="font-semibold text-status-active">
                  <CurrencyAmount value={pool.collectedPesewas} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Outstanding</dt>
                <dd className="font-semibold text-danger">
                  <CurrencyAmount value={pool.outstandingPesewas} />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-muted">Utilisation</dt>
                <dd className="mt-wilms-1">
                  <UtilisationBar percent={pool.utilisationPercent} />
                </dd>
              </div>
            </dl>
          </button>
        </li>
      ))}
    </ul>
  );
}
