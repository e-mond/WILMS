/**
 * In-process notification counters for operations visibility.
 * Exposed via ops metrics when Prometheus endpoint is enabled.
 */
const counters = {
  created: 0,
  sent: 0,
  failed: 0,
  duplicate_prevented: 0,
  payment_due_soon: 0,
  payment_missed: 0,
  payment_confirmed: 0,
  payment_reversed: 0,
};

export type NotificationMetricName = keyof typeof counters;

export function recordNotificationMetric(name: NotificationMetricName, delta = 1): void {
  counters[name] += delta;
}

export function getNotificationMetrics(): Readonly<typeof counters> {
  return { ...counters };
}

export function resetNotificationMetricsForTests(): void {
  for (const key of Object.keys(counters) as NotificationMetricName[]) {
    counters[key] = 0;
  }
}

export function formatNotificationMetricsPrometheus(): string {
  const lines = Object.entries(getNotificationMetrics()).map(
    ([name, value]) => `wilms_notifications_${name.replace(/_/g, '_')} ${value}`,
  );
  return lines.join('\n');
}
