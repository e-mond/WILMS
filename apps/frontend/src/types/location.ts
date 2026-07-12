export interface LocationRegion {
  id: string;
  name: string;
}

export interface LocationDistrict {
  id: string;
  regionId: string;
  name: string;
}

export interface LocationCity {
  id: string;
  districtId: string;
  name: string;
}

export interface CurrentLocationResult {
  latitude: number;
  longitude: number;
  address?: string;
  accuracyMeters?: number;
}
