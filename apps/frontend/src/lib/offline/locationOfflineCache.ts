import {
  OFFLINE_CACHE_KEYS,
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from '@/lib/offline/offlineSnapshotStore';
import type { LocationCity, LocationDistrict, LocationRegion } from '@/types/location';

export async function cacheLocationRegions(regions: LocationRegion[]): Promise<void> {
  await writeOfflineSnapshot(OFFLINE_CACHE_KEYS.locationRegions, regions);
}

export async function readCachedLocationRegions(): Promise<LocationRegion[] | null> {
  const snapshot = await readOfflineSnapshot<LocationRegion[]>(OFFLINE_CACHE_KEYS.locationRegions);
  return snapshot?.value ?? null;
}

export async function cacheLocationDistricts(
  regionId: string,
  districts: LocationDistrict[],
): Promise<void> {
  await writeOfflineSnapshot(`${OFFLINE_CACHE_KEYS.locationDistrictsPrefix}${regionId}`, districts);
}

export async function readCachedLocationDistricts(
  regionId: string,
): Promise<LocationDistrict[] | null> {
  const snapshot = await readOfflineSnapshot<LocationDistrict[]>(
    `${OFFLINE_CACHE_KEYS.locationDistrictsPrefix}${regionId}`,
  );
  return snapshot?.value ?? null;
}

export async function cacheLocationCommunities(
  districtId: string,
  communities: LocationCity[],
): Promise<void> {
  await writeOfflineSnapshot(
    `${OFFLINE_CACHE_KEYS.locationCommunitiesPrefix}${districtId}`,
    communities,
  );
}

export async function readCachedLocationCommunities(
  districtId: string,
): Promise<LocationCity[] | null> {
  const snapshot = await readOfflineSnapshot<LocationCity[]>(
    `${OFFLINE_CACHE_KEYS.locationCommunitiesPrefix}${districtId}`,
  );
  return snapshot?.value ?? null;
}

export async function cacheLocationHierarchy(input: {
  regions: LocationRegion[];
  districts: LocationDistrict[];
  communities: LocationCity[];
  version?: string;
}): Promise<void> {
  await writeOfflineSnapshot(OFFLINE_CACHE_KEYS.locationHierarchy, input);
}

export async function readCachedLocationHierarchy(): Promise<{
  regions: LocationRegion[];
  districts: LocationDistrict[];
  communities: LocationCity[];
  version?: string;
} | null> {
  const snapshot = await readOfflineSnapshot<{
    regions: LocationRegion[];
    districts: LocationDistrict[];
    communities: LocationCity[];
    version?: string;
  }>(OFFLINE_CACHE_KEYS.locationHierarchy);
  return snapshot?.value ?? null;
}
