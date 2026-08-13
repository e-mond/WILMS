export interface GpsDeviceMetadata {
  userAgent?: string;
  platform?: string;
  language?: string;
}

export interface GpsFix {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
  collectorId?: string;
  device?: GpsDeviceMetadata;
}

export interface GpsException {
  unavailable: true;
  reason: string;
  capturedAt: string;
  collectorId?: string;
  device?: GpsDeviceMetadata;
}

export type GpsCoordinates = GpsFix | GpsException;

export function isGpsException(gps: GpsCoordinates | undefined | null): gps is GpsException {
  return Boolean(gps && 'unavailable' in gps && gps.unavailable);
}

export function isGpsFix(gps: GpsCoordinates | undefined | null): gps is GpsFix {
  return Boolean(
    gps &&
      !isGpsException(gps) &&
      typeof gps.latitude === 'number' &&
      typeof gps.longitude === 'number' &&
      Number.isFinite(gps.latitude) &&
      Number.isFinite(gps.longitude),
  );
}

export function formatGpsSummary(gps: GpsCoordinates | undefined | null): string {
  if (isGpsException(gps)) {
    return `Unavailable — ${gps.reason}`;
  }
  if (isGpsFix(gps)) {
    const accuracy = gps.accuracy != null ? ` ±${Math.round(gps.accuracy)}m` : '';
    return `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}${accuracy}`;
  }
  return 'Not captured';
}
