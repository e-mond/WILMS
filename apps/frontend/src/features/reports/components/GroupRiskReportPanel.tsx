'use client';

import Link from 'next/link';
import { DataTable, GroupRiskBadge } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ManagementToolbar } from '@/components/layout/executive';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useGroupRiskReport } from '@/features/reports/hooks/useGroupRiskReport';
import type { GroupRiskReportRow } from '@/types/reports';
import type { GroupRiskLevel } from '@/types/group';

const CSV_HEADERS = ['Group', 'Community', 'Rate %', 'Risk', 'Active Members', 'Total Members'];

export function GroupRiskReportPanel() {
  const { data, isLoading, isError } = useGroupRiskReport();

  if (isLoading) {
    return <LoadingSpinner label="Generating group risk report" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return <EmptyState title="Unable to generate report" description="Try again shortly." />;
  }

  const csvRows = data.rows.map((row) => [
    row.groupName,
    row.community,
    String(row.collectionRatePercent),
    row.riskLevel,
    String(row.activeMemberCount),
    String(row.memberCount),
  ]);

  return (
    <div className="space-y-wilms-4">
      <ManagementToolbar
        search={<p className="text-small text-text-muted">{data.rows.length} groups assessed</p>}
        actions={
          <ExportCsvButton
            label="Export"
            filename="group-risk-report.csv"
            reportType={WILMS_REPORT_TYPE.GROUP_RISK}
            reportTitle="Group Risk Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <DataTable<GroupRiskReportRow>
        variant="executive"
        caption="Group risk report"
        data={data.rows}
        getRowId={(row) => row.groupId}
        columns={[
          {
            id: 'group',
            header: 'Group',
            cell: (row) => (
              <Link
                href={`/groups/${row.groupId}`}
                className="font-semibold text-brand-primary hover:underline"
              >
                {row.groupName}
              </Link>
            ),
          },
          { id: 'community', header: 'Community', cell: (row) => row.community },
          {
            id: 'rate',
            header: 'Rate',
            cell: (row) => `${row.collectionRatePercent}%`,
          },
          {
            id: 'risk',
            header: 'Risk',
            cell: (row) => <GroupRiskBadge riskLevel={row.riskLevel as GroupRiskLevel} />,
          },
          {
            id: 'members',
            header: 'Members',
            cell: (row) => `${row.activeMemberCount}/${row.memberCount}`,
          },
        ]}
      />
    </div>
  );
}
