'use client';

import Link from 'next/link';
import { DetailSidebarCard } from '@/components/layout/executive';
import { Button } from '@/components/ui/Button';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { usePermission } from '@/hooks/usePermissions';
import { PERMISSION } from '@/constants/permissions';

export interface BorrowersAsidePanelProps {
  totalBorrowers: number;
  approvedCount: number;
  atRiskCount: number;
  exportHeaders?: string[];
  exportRows?: string[][];
}

export function BorrowersAsidePanel({
  totalBorrowers,
  approvedCount,
  atRiskCount,
  exportHeaders = ['Borrower ID', 'Full Name', 'Phone Number', 'Group', 'Status'],
  exportRows = [],
}: BorrowersAsidePanelProps) {
  const canRegister = usePermission(PERMISSION.REGISTER_BORROWERS);
  const canManageGroups = usePermission(PERMISSION.MANAGE_GROUPS);
  const canAccessAdmin = usePermission(PERMISSION.ACCESS_ADMIN_PORTAL);
  const canReviewApplications = usePermission(PERMISSION.REVIEW_APPLICATIONS);
  const canApproveBorrowers = usePermission(PERMISSION.APPROVE_BORROWERS);
  const canExport = usePermission(PERMISSION.EXPORT_REPORTS) || canAccessAdmin;

  return (
    <>
      <DetailSidebarCard title="Borrower Directory Summary">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div className="flex justify-between">
            <dt className="text-text-muted">Total borrowers</dt>
            <dd className="font-semibold">{totalBorrowers}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Approved</dt>
            <dd className="font-semibold text-status-active">{approvedCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">At risk / defaulted</dt>
            <dd className="font-semibold text-danger">{atRiskCount}</dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Quick Actions">
        <div className="mt-wilms-3 flex flex-col gap-wilms-2" data-testid="borrowers-quick-actions">
          {canRegister ? (
            <Link href="/borrowers/new">
              <Button variant="secondary" size="sm" className="w-full">
                Add Borrower
              </Button>
            </Link>
          ) : null}
          {canRegister ? (
            <Link href="/borrowers/import">
              <Button variant="secondary" size="sm" className="w-full">
                Import Borrowers
              </Button>
            </Link>
          ) : null}
          {canManageGroups || canAccessAdmin ? (
            <Link href="/groups">
              <Button variant="secondary" size="sm" className="w-full">
                Assign Group
              </Button>
            </Link>
          ) : null}
          {canManageGroups || canAccessAdmin ? (
            <Link href="/ops/reassignment">
              <Button variant="secondary" size="sm" className="w-full">
                Reassign Collector
              </Button>
            </Link>
          ) : null}
          {canExport ? (
            <ExportCsvButton
              label="Export Borrowers"
              filename="WILMS_Borrower_List.csv"
              reportType={WILMS_REPORT_TYPE.BORROWER_LIST}
              reportTitle="Borrower Directory Export"
              headers={exportHeaders}
              rows={exportRows}
              className="w-full"
              permissions={[PERMISSION.EXPORT_REPORTS, PERMISSION.ACCESS_ADMIN_PORTAL]}
            />
          ) : null}
          {canReviewApplications || canApproveBorrowers || canAccessAdmin ? (
            <Link href="/borrowers?status=PENDING">
              <Button variant="ghost" size="sm" className="w-full">
                View Pending Registrations
              </Button>
            </Link>
          ) : null}
        </div>
      </DetailSidebarCard>
    </>
  );
}
