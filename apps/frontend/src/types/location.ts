export interface LocationRegion {
  id: string;
  name: string;
  code?: string | null;
}

export interface LocationDistrict {
  id: string;
  regionId: string;
  name: string;
  code?: string | null;
  category?: string;
}

export interface LocationCommunity {
  id: string;
  districtId: string;
  electoralAreaId?: string | null;
  name: string;
  code?: string | null;
  aliases?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationSubDistrictUnit {
  id: string;
  districtId: string;
  name: string;
  code?: string | null;
  unitType: string;
}

export interface LocationElectoralArea {
  id: string;
  districtId: string;
  subDistrictUnitId?: string | null;
  name: string;
  code?: string | null;
}

export type LocationCity = LocationCommunity;

export interface LocationResponseMeta {
  version: string;
  source: string;
  lastUpdated: string | null;
}

export interface LocationCollectionResponse<T> {
  meta: LocationResponseMeta;
  data: T[];
}

export interface LocationSearchResponse {
  meta: LocationResponseMeta;
  data: {
    regions: LocationRegion[];
    districts: LocationDistrict[];
    communities: LocationCommunity[];
    subDistrictUnits?: LocationSubDistrictUnit[];
    electoralAreas?: LocationElectoralArea[];
  };
}

export interface CommunitySuggestionInput {
  districtId?: string;
  electoralAreaId?: string;
  proposedName: string;
}

export interface LocationSyncStatus {
  id: string;
  datasetSource: string;
  datasetVersion: string;
  importedAt: string;
  regionsImported: number;
  districtsImported: number;
  subDistrictUnitsImported?: number;
  electoralAreasImported?: number;
  communitiesImported: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  notes?: string | null;
}

export interface LocationSyncStatusResponse {
  meta: LocationResponseMeta;
  data: LocationSyncStatus | null;
}

export interface CurrentLocationResult {
  latitude: number;
  longitude: number;
  address?: string;
  digitalAddress?: string;
  community?: string;
  district?: string;
  region?: string;
  accuracyMeters?: number;
  resolvedFrom?: 'community_code' | 'fallback';
}
