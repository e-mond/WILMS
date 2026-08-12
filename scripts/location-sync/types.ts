export type LocationUnitType =
  | 'Sub-Metro Council'
  | 'Area Council'
  | 'Zonal Council'
  | 'Town Council'
  | 'Urban Council';

export type MmdaCategory = 'Metropolitan' | 'Municipal' | 'District';

export interface NormalisedRegion {
  sourceId: string;
  code: string;
  name: string;
}

export interface NormalisedDistrict {
  sourceId: string;
  regionCode: string;
  name: string;
  category: MmdaCategory;
  capital?: string;
}

export interface NormalisedSubDistrictUnit {
  sourceId: string;
  districtSourceId: string;
  name: string;
  unitType: LocationUnitType;
}

export interface NormalisedElectoralArea {
  sourceId: string;
  districtSourceId: string;
  subDistrictUnitSourceId?: string;
  name: string;
  aliases?: string[];
}

export interface NormalisedCommunity {
  sourceId: string;
  districtSourceId: string;
  electoralAreaSourceId?: string;
  name: string;
  aliases?: string[];
  latitude?: number;
  longitude?: number;
  geometryRef?: string;
}

export interface LocationSnapshot {
  source: string;
  datasetVersion: string;
  checksum: string;
  regions: NormalisedRegion[];
  districts: NormalisedDistrict[];
  subDistrictUnits: NormalisedSubDistrictUnit[];
  electoralAreas: NormalisedElectoralArea[];
  communities: NormalisedCommunity[];
}

export interface LocationSourceAdapter {
  readonly id: string;
  load(): LocationSnapshot;
}
