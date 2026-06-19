'use client';

import { CurrencyAmount, StatCard } from '@/components/data-display';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { LoanProgressSummary } from '@/types/loan';

export interface LoanProgressMetricsProps {
  progress: LoanProgressSummary;
}

export function LoanProgressMetrics({ progress }: LoanProgressMetricsProps) {
  return (
    <div className="space-y-wilms-4">
      <ProgressBar
        label="Percent repaid"
        value={progress.percentRepaid}
        max={100}
      />

      <div className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total paid"
          value={<CurrencyAmount value={progress.totalPaidPesewas} />}
        />
        <StatCard
          label="Remaining balance"
          value={<CurrencyAmount value={progress.remainingBalancePesewas} />}
        />
        <StatCard
          label="Weeks completed"
          value={`${progress.weeksCompleted} / ${progress.weeksCompleted + progress.weeksRemaining}`}
        />
        <StatCard label="Weeks remaining" value={progress.weeksRemaining} />
        <StatCard label="Missed payments" value={progress.totalMissed} />
        <StatCard
          label="Payment consistency"
          value={`${progress.paymentConsistencyScore}%`}
        />
      </div>
    </div>
  );
}
