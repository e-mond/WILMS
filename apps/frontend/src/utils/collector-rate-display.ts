/** Rate band colours aligned with CollectorsManagement.jpeg reference. */

export function collectorRateTextClass(rate: number): string {
  if (rate >= 90) {
    return 'text-status-active';
  }

  if (rate >= 70) {
    return 'text-executive-gold';
  }

  return 'text-danger';
}

export function collectorRateBarClass(rate: number): string {
  if (rate >= 90) {
    return 'bg-status-active';
  }

  if (rate >= 70) {
    return 'bg-executive-gold';
  }

  return 'bg-danger';
}
