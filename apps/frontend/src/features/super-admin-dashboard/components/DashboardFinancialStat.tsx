'use client';

import type { ReactNode } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import { cn } from '@/utils/cn';

export interface DashboardFinancialStatProps {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: 'default' | 'success' | 'danger';
}

export function DashboardFinancialStat({
  label,
  value,
  detail,
  tone = 'default',
}: DashboardFinancialStatProps) {
  return (
    <div className="rounded-sm border border-border bg-card p-wilms-4 sm:p-wilms-5">
      <p className="text-small font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div
        className={cn(
          'mt-wilms-2 text-heading-3 font-bold',
          tone === 'success' && 'text-status-active',
          tone === 'danger' && 'text-danger',
          tone === 'default' && 'text-text-primary',
        )}
      >
        {value}
      </div>
      {detail ? <p className="mt-wilms-2 text-small leading-relaxed text-text-muted">{detail}</p> : null}
    </div>
  );
}

export function DashboardFinancialStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-wilms-4 sm:gap-wilms-5">{children}</div>;
}

export function formatCollectionDetail(
  collectedPesewas: number,
  expectedPesewas: number,
  collectionRatePercent: number,
): string {
  const expectedGhs = (expectedPesewas / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${collectionRatePercent}% of GHS ${expectedGhs} expected`;
}

export function CurrencyStatValue({ pesewas }: { pesewas: number }) {
  return <CurrencyAmount value={pesewas} />;
}
