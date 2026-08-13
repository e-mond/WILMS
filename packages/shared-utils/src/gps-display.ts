export interface GpsDisplayInput {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  accuracyMeters?: number | null;
  capturedAt?: string | null;
  unavailable?: boolean | null;
  reason?: string | null;
  source?: string | null;
  collectorId?: string | null;
  device?: Record<string, unknown> | null;
}

export function formatGpsDisplaySummary(gps: GpsDisplayInput | null | undefined): string {
  if (!gps) {
    return 'Not captured';
  }

  if (gps.unavailable) {
    const reason = gps.reason?.trim() || 'reason not recorded';
    const when = gps.capturedAt ? ` · ${gps.capturedAt}` : '';
    const source = gps.source?.trim() ? ` · ${gps.source.trim()}` : '';
    return `Unavailable — ${reason}${when}${source}`;
  }

  if (typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
    const accuracyValue = gps.accuracy ?? gps.accuracyMeters;
    const accuracy = accuracyValue != null ? ` ±${Math.round(Number(accuracyValue))}m` : '';
    const when = gps.capturedAt ? ` · ${gps.capturedAt}` : '';
    const source = gps.source?.trim() ? ` · ${gps.source.trim()}` : ' · device';
    return `${Number(gps.latitude).toFixed(6)}, ${Number(gps.longitude).toFixed(6)}${accuracy}${when}${source}`;
  }

  return 'Not captured';
}

export function isGpsFixDisplay(gps: GpsDisplayInput | null | undefined): boolean {
  return Boolean(
    gps &&
      !gps.unavailable &&
      typeof gps.latitude === 'number' &&
      typeof gps.longitude === 'number' &&
      Number.isFinite(gps.latitude) &&
      Number.isFinite(gps.longitude),
  );
}
