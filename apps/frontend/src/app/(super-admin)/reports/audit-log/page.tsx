import { PageShell } from '@/components/layout/PageShell';
import { AuditLogReportPanel } from '@/features/reports/components/AuditLogReportPanel';

export default function AuditLogReportPage() {
  return (
    <PageShell variant="executive">
      <AuditLogReportPanel />
    </PageShell>
  );
}
