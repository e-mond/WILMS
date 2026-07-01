'use client';

import Link from 'next/link';
import { DataTable, GroupRiskBadge } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useGroupRiskReport } from '@/features/reports/hooks/useGroupRiskReport';
import type { GroupRiskReportRow } from '@/types/reports';
import type { GroupRiskLevel } from '@/types/group';

const CSV_HEADERS = ['Group', 'Community', 'Rate %', 'Risk', 'Active Members', 'Total Members'];

export function GroupRiskReportPanel() {
  const { data, isLoading, isError, refetch } = useGroupRiskReport();
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });

  return (
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError || !data}
      errorMessage="Unable to generate report. Try again shortly."
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? <GroupRiskReportContent data={data} /> : null}
    </QueryStatePanel>
  );
}

function GroupRiskReportContent({
  data,
}: {
  data: NonNullable<ReturnType<typeof useGroupRiskReport>['data']>;
}) {
  const rows = data.rows ?? [];
  const csvRows = rows.map((row) => [
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
        search={<p className="text-small text-text-muted">{rows.length} groups assessed</p>}
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
        data={rows}
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
