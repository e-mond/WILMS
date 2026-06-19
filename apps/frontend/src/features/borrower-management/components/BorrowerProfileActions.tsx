'use client';

import { useMemo } from 'react';
import { ExportDownloadIcon } from '@/components/icons/ExportDownloadIcon';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { PERMISSION } from '@/constants/permissions';
import {
  buildBorrowerProfileExportDocument,
  downloadWilmsCsv,
  downloadWilmsExcel,
  downloadWilmsPdf,
  printWilmsDocument,
  useWilmsExportActor,
  type BorrowerExportVariant,
} from '@/features/export';
import type { BorrowerFullProfile } from '@/types/borrower';
import type { BorrowerLoanHistoryEntry, LoanPaymentLogEntry, LoanProgressSummary } from '@/types/loan';
import type { LoanScheduleWeek } from '@/types/loan-schedule';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

export interface BorrowerProfileActionsProps {
  borrower: BorrowerFullProfile;
  loans: BorrowerLoanHistoryEntry[];
  activeLoan?: BorrowerLoanHistoryEntry;
  progress?: LoanProgressSummary;
  paymentLog: LoanPaymentLogEntry[];
  scheduleWeeks: LoanScheduleWeek[];
  className?: string;
}

const PRINT_ERROR_MESSAGES = {
  iframe_unavailable: 'Printing is unavailable in this browser. Download PDF instead.',
  print_blocked: 'Printing was blocked. Download PDF or try again.',
  unknown: 'Unable to open the print dialog. Download PDF instead.',
} as const;

export function BorrowerProfileActions({
  borrower,
  loans,
  activeLoan,
  progress,
  paymentLog,
  scheduleWeeks,
  className,
}: BorrowerProfileActionsProps) {
  const toast = useToast();
  const generatedBy = useWilmsExportActor();
  const filenameBase = `${borrower.id}-profile`;

  const fullDocument = useMemo(
    () =>
      buildBorrowerProfileExportDocument({
        borrower,
        generatedBy,
        loans,
        activeLoan,
        progress,
        paymentLog,
        scheduleWeeks,
        variant: 'full',
      }),
    [activeLoan, borrower, generatedBy, loans, paymentLog, progress, scheduleWeeks],
  );

  async function handlePrint(variant: BorrowerExportVariant, label: string) {
    const document =
      variant === 'full'
        ? fullDocument
        : buildBorrowerProfileExportDocument({
            borrower,
            generatedBy,
            loans,
            activeLoan,
            progress,
            paymentLog,
            scheduleWeeks,
            variant,
          });

    const result = await printWilmsDocument(document);

    if (!result.ok) {
      toast.warning(`${label} unavailable`, { message: PRINT_ERROR_MESSAGES[result.reason] });
    }
  }

  return (
    <PermissionGate permission={PERMISSION.EXPORT_REPORTS}>
      <div className={cn('flex flex-wrap gap-wilms-2 print:hidden', className)}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-wilms-2"
        onClick={() => downloadWilmsCsv(fullDocument, `${filenameBase}.csv`)}
      >
        <ExportDownloadIcon />
        Export CSV
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-wilms-2"
        onClick={() => void downloadWilmsExcel(fullDocument, `${filenameBase}.xlsx`)}
      >
        <ExportDownloadIcon />
        Export Excel
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => downloadWilmsPdf(fullDocument, `${filenameBase}.pdf`)}
      >
        Download Full Borrower Report
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => void handlePrint('full', 'Print profile')}>
        Print Profile
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void handlePrint('loan-summary', 'Print loan summary')}
      >
        Print Loan Summary
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void handlePrint('payment-history', 'Print payment history')}
      >
        Print Payment History
      </Button>
      </div>
    </PermissionGate>
  );
}
