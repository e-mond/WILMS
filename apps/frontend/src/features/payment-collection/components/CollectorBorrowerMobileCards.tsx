import Link from 'next/link';
import { CollectorPaymentStatusBadge, CurrencyAmount } from '@/components/data-display';
import type { CollectorDashboardBorrower } from '@/types/collector-dashboard';

export interface CollectorBorrowerMobileCardsProps {
  borrowers: CollectorDashboardBorrower[];
}

export function CollectorBorrowerMobileCards({ borrowers }: CollectorBorrowerMobileCardsProps) {
  return (
    <ul className="grid gap-wilms-3 md:hidden">
      {borrowers.map((row) => (
        <li key={row.borrowerId} className="rounded-sm border border-border bg-card p-wilms-4">
          <div className="flex items-start justify-between gap-wilms-3">
            <div className="min-w-0">
              <p className="font-semibold text-text-primary">{row.borrowerName}</p>
              <p className="text-small text-text-muted">{row.community}</p>
            </div>
            <CollectorPaymentStatusBadge status={row.paymentStatus} />
          </div>
          <dl className="mt-wilms-3 grid grid-cols-2 gap-wilms-2 text-small">
            <div>
              <dt className="text-text-muted">Expected</dt>
              <dd className="font-semibold">
                <CurrencyAmount value={row.expectedPesewas} />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Collected</dt>
              <dd className="font-semibold text-status-active">
                <CurrencyAmount value={row.collectedPesewas} />
              </dd>
            </div>
          </dl>
          <Link
            href={`/collector/payment/${row.borrowerId}`}
            className="mt-wilms-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-sm border border-brand-primary px-wilms-4 text-body font-semibold text-brand-primary hover:bg-brand-primary-light"
          >
            Record payment
          </Link>
        </li>
      ))}
    </ul>
  );
}
