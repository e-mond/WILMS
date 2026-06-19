import type { BorrowerFullProfile } from '@/types/borrower';
import type { BorrowerLoanHistoryEntry, LoanPaymentLogEntry, LoanProgressSummary } from '@/types/loan';
import type { LoanScheduleWeek } from '@/types/loan-schedule';
import { WILMS_REPORT_TYPE, type WilmsExportDocument } from '@/features/export/types';
import { generateReportId } from '@/features/export/utils/report-id';
import { getWilmsEnvironment } from '@/features/export/utils/environment';
import {
  formatExportDate,
  formatExportTimestamp,
  formatPesewasForExport,
  formatPercentForExport,
} from '@/features/export/utils/formatters';

export type BorrowerExportVariant = 'full' | 'loan-summary' | 'payment-history';

export interface BorrowerProfileExportInput {
  borrower: BorrowerFullProfile;
  generatedBy: string;
  loans: BorrowerLoanHistoryEntry[];
  activeLoan?: BorrowerLoanHistoryEntry;
  progress?: LoanProgressSummary;
  paymentLog: LoanPaymentLogEntry[];
  scheduleWeeks: LoanScheduleWeek[];
  variant?: BorrowerExportVariant;
}

function buildPaymentRows(paymentLog: LoanPaymentLogEntry[]): string[][] {
  return paymentLog.map((entry) => [
    formatExportDate(entry.recordedAt),
    formatPesewasForExport(entry.amountPesewas).replace('GHS ', ''),
    entry.weekNumber ? String(entry.weekNumber) : '—',
    entry.collectorId,
    entry.receiptNumber ?? '—',
    entry.gpsVerified ? 'Verified' : 'Not verified',
    entry.paymentStatus ?? 'CONFIRMED',
  ]);
}

function buildScheduleRows(scheduleWeeks: LoanScheduleWeek[]): string[][] {
  return scheduleWeeks.map((week) => [
    formatExportDate(week.dueDate),
    formatPesewasForExport(week.amountPesewas).replace('GHS ', ''),
    week.status === 'PAID' ? formatPesewasForExport(week.amountPesewas).replace('GHS ', '') : '0.00',
    week.status === 'PAID' ? '0.00' : formatPesewasForExport(week.amountPesewas).replace('GHS ', ''),
    week.status,
  ]);
}

export function buildBorrowerProfileExportDocument(input: BorrowerProfileExportInput): WilmsExportDocument {
  const variant = input.variant ?? 'full';
  const reportId = generateReportId(WILMS_REPORT_TYPE.BORROWER_PROFILE);
  const generatedAt = formatExportTimestamp();
  const { borrower, activeLoan, progress, paymentLog, scheduleWeeks, loans } = input;

  const titleByVariant: Record<BorrowerExportVariant, string> = {
    full: `Borrower Profile — ${borrower.fullName}`,
    'loan-summary': `Loan Summary — ${borrower.fullName}`,
    'payment-history': `Payment History — ${borrower.fullName}`,
  };

  const sections: WilmsExportDocument['sections'] = [];

  if (variant === 'full' || variant === 'loan-summary') {
    sections.push({
      title: 'Borrower Summary',
      type: 'summary',
      summaryItems: [
        { label: 'Full Name', value: borrower.fullName },
        { label: 'Borrower ID', value: borrower.id },
        { label: 'Phone Number', value: borrower.phone },
        { label: 'Alternative Phone', value: borrower.alternativePhone ?? 'Not provided' },
        { label: 'Email Address', value: borrower.email ?? 'Not provided' },
        { label: 'Address', value: borrower.houseAddress ?? borrower.community },
        { label: 'GPS Location', value: borrower.gpsAddress ?? 'Not provided' },
        { label: 'National ID', value: borrower.nationalId },
        { label: 'Registration Date', value: formatExportDate(borrower.registeredAt) },
        { label: 'Status', value: borrower.status },
        { label: 'Group', value: borrower.groupName },
        { label: 'Community', value: borrower.community },
      ],
    });
  }

  if ((variant === 'full' || variant === 'loan-summary') && activeLoan) {
    sections.push({
      title: 'Loan Summary',
      type: 'summary',
      summaryItems: [
        { label: 'Current Loan', value: activeLoan.id },
        { label: 'Loan Amount', value: formatPesewasForExport(activeLoan.amountPesewas) },
        { label: 'Disbursement Date', value: formatExportDate(activeLoan.startDate) },
        { label: 'Outstanding Balance', value: formatPesewasForExport(activeLoan.outstandingPesewas) },
        {
          label: 'Amount Repaid',
          value: formatPesewasForExport(activeLoan.amountPesewas - activeLoan.outstandingPesewas),
        },
        { label: 'Remaining Balance', value: formatPesewasForExport(activeLoan.outstandingPesewas) },
        { label: 'Weeks Remaining', value: String(progress?.weeksRemaining ?? activeLoan.durationWeeks) },
        { label: 'Loan Status', value: activeLoan.status },
        {
          label: 'Repayment Performance',
          value: progress ? formatPercentForExport(progress.percentRepaid) : '—',
        },
      ],
    });
  }

  if (variant === 'full' || variant === 'payment-history') {
    sections.push({
      title: 'Payment History',
      type: 'table',
      table: {
        headers: [
          'Payment Date',
          'Amount (GHS)',
          'Week Number',
          'Collector',
          'Receipt Number',
          'GPS Verification',
          'Payment Status',
        ],
        rows: buildPaymentRows(paymentLog),
        caption: `Repayment history for ${borrower.fullName}`,
      },
    });
  }

  if (variant === 'full' && scheduleWeeks.length > 0) {
    sections.push({
      title: 'Payment Schedule',
      type: 'table',
      table: {
        headers: ['Scheduled Date', 'Amount Due (GHS)', 'Amount Paid (GHS)', 'Outstanding (GHS)', 'Status'],
        rows: buildScheduleRows(scheduleWeeks),
      },
    });
  }

  if (variant === 'full') {
    sections.push({
      title: 'Risk Summary',
      type: 'summary',
      summaryItems: [
        { label: 'Risk Rating', value: borrower.risk.riskRating },
        { label: 'Missed Payment Count', value: String(borrower.risk.missedPaymentCount) },
        { label: 'Default Status', value: borrower.risk.defaultStatus },
        { label: 'Blacklist Status', value: borrower.risk.blacklistStatus },
        {
          label: 'Flags',
          value: borrower.risk.flags.length ? borrower.risk.flags.join(', ') : 'None',
        },
        {
          label: 'Notes',
          value: borrower.risk.notes.length ? borrower.risk.notes.join(' ') : 'None',
        },
      ],
    });

    if (loans.length > 0) {
      sections.push({
        title: 'All Loans',
        type: 'table',
        table: {
          headers: ['Loan ID', 'Amount (GHS)', 'Outstanding (GHS)', 'Status', 'Start Date'],
          rows: loans.map((loan) => [
            loan.id,
            formatPesewasForExport(loan.amountPesewas).replace('GHS ', ''),
            formatPesewasForExport(loan.outstandingPesewas).replace('GHS ', ''),
            loan.status,
            formatExportDate(loan.startDate),
          ]),
        },
      });
    }
  }

  sections.push({
    title: 'Audit Information',
    type: 'summary',
    summaryItems: [
      { label: 'Report ID', value: reportId },
      { label: 'Generated By', value: input.generatedBy },
      { label: 'Generated At', value: generatedAt },
      { label: 'Environment', value: getWilmsEnvironment() },
      { label: 'Borrower ID', value: borrower.id },
    ],
  });

  return {
    metadata: {
      reportType: WILMS_REPORT_TYPE.BORROWER_PROFILE,
      reportTitle: titleByVariant[variant],
      reportId,
      generatedAt,
      generatedBy: input.generatedBy,
      environment: getWilmsEnvironment(),
      referencePrefix: 'BOR',
      entityRef: borrower.id,
    },
    executiveSummary: `${borrower.fullName} (${borrower.id}) borrower report generated for official WILMS record keeping.`,
    sections,
    orientation: variant === 'payment-history' ? 'landscape' : 'portrait',
  };
}
