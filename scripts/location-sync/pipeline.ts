import type { LocationSnapshot, LocationSourceAdapter } from './types.js';
import { gadmAdapter } from './adapters/gadm.js';
import { geoboundariesAdapter } from './adapters/geoboundaries.js';
import { gssAdapter } from './adapters/gss.js';
import { osmAdapter } from './adapters/osm.js';
import { normaliseMatchKey } from './normalize.js';

const adapters: Record<string, LocationSourceAdapter> = {
  gss: gssAdapter,
  imccod: gssAdapter,
  geoboundaries: geoboundariesAdapter,
  gadm: gadmAdapter,
  osm: osmAdapter,
};

export function getLocationAdapter(id = process.env.WILMS_LOCATION_ADAPTER ?? 'gss'): LocationSourceAdapter {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unknown location adapter "${id}". Expected one of: ${Object.keys(adapters).join(', ')}`);
  }
  return adapter;
}

export function validateSnapshot(snapshot: LocationSnapshot): string[] {
  const errors: string[] = [];
  if (snapshot.regions.length !== 16) {
    errors.push(`Expected 16 regions, found ${snapshot.regions.length}`);
  }
  if (snapshot.districts.length !== 261) {
    errors.push(`Expected 261 MMDAs, found ${snapshot.districts.length}`);
  }

  const regionCodes = new Set(snapshot.regions.map((row) => row.code));
  for (const district of snapshot.districts) {
    if (!regionCodes.has(district.regionCode)) {
      errors.push(`District ${district.name} references unknown region ${district.regionCode}`);
    }
  }

  const districtIds = new Set(snapshot.districts.map((row) => row.sourceId));
  for (const unit of snapshot.subDistrictUnits) {
    if (!districtIds.has(unit.districtSourceId)) {
      errors.push(`Sub-district unit ${unit.name} references unknown district ${unit.districtSourceId}`);
    }
  }

  const unitIds = new Set(snapshot.subDistrictUnits.map((row) => row.sourceId));
  for (const area of snapshot.electoralAreas) {
    if (!districtIds.has(area.districtSourceId)) {
      errors.push(`Electoral area ${area.name} references unknown district ${area.districtSourceId}`);
    }
    if (area.subDistrictUnitSourceId && !unitIds.has(area.subDistrictUnitSourceId)) {
      errors.push(`Electoral area ${area.name} references unknown sub-district unit`);
    }
  }

  const seenDistrictKeys = new Set<string>();
  for (const district of snapshot.districts) {
    const key = `${district.regionCode}:${normaliseMatchKey(district.name)}`;
    if (seenDistrictKeys.has(key)) {
      errors.push(`Duplicate MMDA after normalisation: ${district.name}`);
    }
    seenDistrictKeys.add(key);
  }

  return errors;
}

export async function loadValidatedSnapshot(adapterId?: string): Promise<LocationSnapshot> {
  const adapter = getLocationAdapter(adapterId);
  const snapshot = adapter.load();
  const errors = validateSnapshot(snapshot);
  if (errors.length > 0) {
    throw new Error(`Location snapshot failed validation:\n${errors.join('\n')}`);
  }
  return snapshot;
}
