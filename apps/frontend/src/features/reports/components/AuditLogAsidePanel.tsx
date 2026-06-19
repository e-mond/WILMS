'use client';

import { DetailSidebarCard } from '@/components/layout/executive';

export interface AuditLogAsidePanelProps {
  entriesLoaded: number;
}

export function AuditLogAsidePanel({ entriesLoaded }: AuditLogAsidePanelProps) {
  return (
    <>
      <DetailSidebarCard title="Audit Trail Status">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div className="flex justify-between">
            <dt className="text-text-muted">Entries loaded</dt>
            <dd className="font-semibold">{entriesLoaded}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Log integrity</dt>
            <dd className="font-semibold text-status-active">Immutable</dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Compliance Notes">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small text-text-muted">
          <li>All exports include WILMS report IDs for traceability.</li>
          <li>Filter by user or action to investigate specific events.</li>
          <li>Retention policy: 7 years in production deployment.</li>
        </ul>
      </DetailSidebarCard>
    </>
  );
}
