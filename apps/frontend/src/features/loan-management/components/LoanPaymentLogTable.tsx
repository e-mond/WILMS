'use client';

import { CurrencyAmount, DataTable } from '@/components/data-display';
import { Badge } from '@/components/ui/Badge';
import type { LoanPaymentLogEntry } from '@/types/loan';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveDisbursementDisplayId, resolveCollectorDisplayId, resolvePaymentDisplayId } from '@/utils/entity-display-id';

export interface LoanPaymentLogTableProps {
  entries: LoanPaymentLogEntry[];
  detailed?: boolean;
}

export function LoanPaymentLogTable({ entries, detailed = false }: LoanPaymentLogTableProps) {
  return (
    <DataTable<LoanPaymentLogEntry>
      caption="Loan payment log"
      data={entries}
      emptyMessage="No disbursement or repayment transactions recorded yet."
      getRowId={(row) => row.id}
      columns={
        detailed
          ? [
              {
                id: 'date',
                header: 'Payment Date',
                cell: (row) => formatDisplayDate(row.recordedAt.slice(0, 10)),
              },
              {
                id: 'amount',
                header: 'Amount',
                cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
              },
              {
                id: 'week',
                header: 'Week Number',
                cell: (row) => (row.weekNumber ? `Week ${row.weekNumber}` : '—'),
              },
              { id: 'collector', header: 'Collector', cell: (row) => resolveCollectorDisplayId({ id: row.collectorId }) },
              {
                id: 'receipt',
                header: 'Receipt Number',
                cell: (row) => row.receiptNumber ?? '—',
              },
              {
                id: 'gps',
                header: 'GPS Verification',
                cell: (row) => (row.gpsVerified ? 'Verified' : 'Not verified'),
              },
              {
                id: 'status',
                header: 'Payment Status',
                cell: (row) => (
                  <Badge variant={row.paymentStatus === 'CONFIRMED' ? 'success' : 'pending'}>
                    {row.paymentStatus ?? 'CONFIRMED'}
                  </Badge>
                ),
              },
            ]
          : [
              {
                id: 'reference',
                header: 'Reference',
                cell: (row) => (
                  <span className="font-semibold text-brand-primary">
                    {row.type === 'DISBURSEMENT'
                      ? resolveDisbursementDisplayId(row)
                      : resolvePaymentDisplayId(row)}
                  </span>
                ),
              },
              {
                id: 'date',
                header: 'Date',
                cell: (row) => formatDisplayDate(row.recordedAt.slice(0, 10)),
              },
              {
                id: 'type',
                header: 'Type',
                cell: (row) => (
                  <Badge variant={row.type === 'REPAYMENT' ? 'success' : 'default'}>
                    {row.type === 'REPAYMENT' ? 'Repayment' : 'Disbursement'}
                  </Badge>
                ),
              },
              {
                id: 'amount',
                header: 'Amount',
                cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
              },
              { id: 'collector', header: 'Collector', cell: (row) => resolveCollectorDisplayId({ id: row.collectorId }) },
            ]
      }
    />
  );
}
