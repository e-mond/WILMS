import type { ReportsHubMetadata } from '@/types/reports';

export const MOCK_REPORTS_HUB: ReportsHubMetadata = {
  scheduledReports: [
    {
      id: 'sched-daily-collection',
      title: 'Daily Collection',
      scheduleLabel: 'Every day · 18:00 GMT',
    },
    {
      id: 'sched-loan-portfolio',
      title: 'Loan Portfolio',
      scheduleLabel: 'Weekly · Monday 07:00 GMT',
    },
  ],
  recentExports: [
    {
      id: 'WILMS-COL-2026-000014',
      label: 'WILMS-COL-2026-000014 · Daily Collection',
    },
    {
      id: 'WILMS-LON-2026-000011',
      label: 'WILMS-LON-2026-000011 · Loan Portfolio',
    },
    {
      id: 'WILMS-RSK-2026-000009',
      label: 'WILMS-RSK-2026-000009 · Risk Flags',
    },
  ],
  lastComplianceExport: {
    exportedAt: '2026-06-09T09:12:00.000Z',
    exportedBy: 'Super Admin',
  },
  categoryBreakdown: [],
};
