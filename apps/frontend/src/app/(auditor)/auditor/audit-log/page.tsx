import { PageShell } from '@/components/layout/PageShell';
import { AuditLogReportPanel } from '@/features/reports/components/AuditLogReportPanel';

export default function AuditorAuditLogPage() {
  return (
    <PageShell
      description="Immutable audit trail — read-only access."
      variant="executive"
    >
      <AuditLogReportPanel />
    </PageShell>
  );
}
