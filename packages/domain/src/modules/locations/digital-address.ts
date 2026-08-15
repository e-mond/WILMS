/**
 * Ghana Digital Address helpers.
 *
 * Official GhanaPost GPS codes are not generated here. When a nearby community
 * from the location master has a stored code in Ghana Digital Address form, that
 * value is used. Otherwise a deterministic fallback code is derived from the
 * region prefix and coordinates so the registration form never shows raw WGS84
 * as the only GPS field.
 */

const GHANA_DIGITAL_ADDRESS = /^[A-Z]{2}-\d{3}-\d{4}$/;

export function isGhanaDigitalAddress(value: string | null | undefined): boolean {
  return Boolean(value && GHANA_DIGITAL_ADDRESS.test(value.trim().toUpperCase()));
}

export function encodeFallbackDigitalAddress(
  latitude: number,
  longitude: number,
  regionCode?: string | null,
): string {
  const prefix = (regionCode?.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'GH').toUpperCase();
  const latQuant = Math.abs(Math.round((latitude - 4.5) * 1000)) % 1000;
  const lngQuant = Math.abs(Math.round((longitude + 3.25) * 1000)) % 10000;
  return `${prefix}-${String(latQuant).padStart(3, '0')}-${String(lngQuant).padStart(4, '0')}`;
}

export function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(a)));
}
