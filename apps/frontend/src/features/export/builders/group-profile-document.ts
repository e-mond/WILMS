import type { GroupDetail } from '@/types/group-detail';
import { WILMS_REPORT_TYPE } from '@/features/export/types';
import type { WilmsExportDocument } from '@/features/export/types';
import { generateReportId } from '@/features/export/utils/report-id';
import { getWilmsEnvironment } from '@/features/export/utils/environment';
import {
  formatExportTimestamp,
  formatPesewasForExport,
  formatPercentForExport,
} from '@/features/export/utils/formatters';
import { GROUP_MEMBER_ROLE } from '@/types/group';

export function buildGroupProfileExportDocument(
  group: GroupDetail,
  generatedBy: string,
): WilmsExportDocument {
  const generatedAt = formatExportTimestamp();
  const reportId = generateReportId(WILMS_REPORT_TYPE.GROUP_PROFILE);

  return {
    metadata: {
      reportType: WILMS_REPORT_TYPE.GROUP_PROFILE,
      reportTitle: `Group Profile — ${group.name}`,
      reportId,
      generatedAt,
      generatedBy,
      environment: getWilmsEnvironment(),
      referencePrefix: 'GRP',
      entityRef: group.id,
    },
    executiveSummary: `${group.name} (${group.id}) is ${group.statusLabel.toLowerCase()} in ${group.community}. The group has ${group.activeMemberCount} active members, ${group.activeLoanCount} active loans, and a collection rate of ${group.collectionRatePercent}%. Outstanding balance is ${formatPesewasForExport(group.outstandingPesewas)}.`,
    sections: [
      {
        title: 'Group Summary',
        type: 'summary',
        summaryItems: [
          { label: 'Group ID', value: group.id },
          { label: 'Group Name', value: group.name },
          { label: 'Status', value: group.statusLabel },
          { label: 'Community / Zone', value: group.community },
          { label: 'Creation Date', value: group.formedAt },
          { label: 'Assigned Collector', value: group.collector.fullName },
          { label: 'Group Leader', value: group.leader.fullName },
          { label: 'Cycle', value: group.cycle.label },
          { label: 'Risk Rating', value: group.riskLevel },
          { label: 'Total Members', value: String(group.memberCount) },
          { label: 'Active Members', value: String(group.activeMemberCount) },
          { label: 'Active Loans', value: String(group.activeLoanCount) },
          { label: 'Outstanding Balance', value: formatPesewasForExport(group.outstandingPesewas) },
          { label: 'Repayment Performance', value: formatPercentForExport(group.repaymentPerformancePercent) },
          { label: 'Collection Rate', value: formatPercentForExport(group.collectionRatePercent) },
        ],
      },
      {
        title: 'Key Metrics',
        type: 'metrics',
        metrics: [
          { label: 'Collection Rate', value: formatPercentForExport(group.collectionRatePercent), tone: 'success' },
          { label: 'Outstanding', value: formatPesewasForExport(group.outstandingPesewas) },
          { label: 'Active Loans', value: String(group.activeLoanCount) },
          { label: 'Members', value: `${group.activeMemberCount}/${group.memberCount}` },
        ],
      },
      {
        title: 'Group Leader Information',
        type: 'summary',
        summaryItems: [
          { label: 'Full Name', value: group.leader.fullName },
          { label: 'Borrower ID', value: group.leader.borrowerId },
          { label: 'Phone Number', value: group.leader.phone },
          { label: 'Email Address', value: group.leader.email ?? '—' },
          { label: 'National ID', value: group.leader.nationalId },
          { label: 'Address', value: group.leader.address },
          { label: 'GPS Location', value: group.leader.gpsAddress },
          { label: 'Member Since', value: group.leader.memberSince },
          { label: 'Current Status', value: group.leader.status },
        ],
      },
      {
        title: 'Assigned Collector Information',
        type: 'summary',
        summaryItems: [
          { label: 'Full Name', value: group.collector.fullName },
          { label: 'Collector ID', value: group.collector.id },
          { label: 'Phone Number', value: group.collector.phone },
          { label: 'Email', value: group.collector.email ?? '—' },
          { label: 'Assigned Zone', value: group.collector.zone },
          { label: 'Assigned Groups', value: String(group.collector.assignedGroupCount) },
          { label: 'Collection Rate', value: formatPercentForExport(group.collector.collectionRatePercent) },
          { label: 'Last Activity', value: group.collector.lastActiveAt },
        ],
      },
      {
        title: 'Group Members',
        type: 'table',
        table: {
          headers: [
            'Borrower ID',
            'Full Name',
            'Role',
            'Phone Number',
            'Status',
            'Current Loan Status',
            'Outstanding Balance (GHS)',
            'Last Payment Date',
            'Payment Consistency',
          ],
          rows: group.members.map((member) => [
            member.borrowerId,
            member.fullName,
            member.role === GROUP_MEMBER_ROLE.LEADER ? 'Group Leader' : 'Member',
            member.phone,
            member.borrowerStatus,
            member.loanStatus,
            formatPesewasForExport(member.outstandingPesewas).replace('GHS ', ''),
            member.lastPaymentDate ?? '—',
            formatPercentForExport(member.paymentConsistencyPercent),
          ]),
          caption: `${group.name} membership register`,
        },
      },
      {
        title: 'Loan & Risk Summary',
        type: 'summary',
        summaryItems: [
          { label: 'Disbursed (GHS)', value: formatPesewasForExport(group.disbursedPesewas) },
          { label: 'Collected (GHS)', value: formatPesewasForExport(group.collectedPesewas) },
          { label: 'Outstanding (GHS)', value: formatPesewasForExport(group.outstandingPesewas) },
          { label: 'Risk Level', value: group.riskLevel },
          { label: 'Registration Officer', value: group.registrationOfficerName },
        ],
      },
      {
        title: 'Audit Information',
        type: 'summary',
        summaryItems: [
          { label: 'Report ID', value: reportId },
          { label: 'Generated By', value: generatedBy },
          { label: 'Generated At', value: generatedAt },
          { label: 'Environment', value: getWilmsEnvironment() },
          { label: 'Entity Reference', value: group.id },
        ],
      },
    ],
    signatures: [
      { label: 'Prepared By', name: generatedBy },
      { label: 'Reviewed By' },
      { label: 'Authorized Signatory' },
    ],
    orientation: 'landscape',
  };
}
