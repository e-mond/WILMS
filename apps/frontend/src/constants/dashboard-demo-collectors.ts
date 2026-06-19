export interface DashboardDemoCollector {
  id: string;
  displayName: string;
}

/** Display-only collector personas used in dashboard demo seeds (not login accounts). */
export const DASHBOARD_DEMO_COLLECTORS: DashboardDemoCollector[] = [
  { id: 'user-collector', displayName: 'Field Collector' },
  { id: 'user-collector-2', displayName: 'Grace Osei' },
  { id: 'user-collector-3', displayName: 'Abena Kwarteng' },
  { id: 'user-collector-4', displayName: 'Esi Mensah' },
];

export function resolveDashboardCollectorName(collectorId: string): string {
  return (
    DASHBOARD_DEMO_COLLECTORS.find((collector) => collector.id === collectorId)?.displayName ??
    'Collector'
  );
}
