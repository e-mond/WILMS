export interface LocationHierarchyFields {
  region?: string | null;
  district?: string | null;
  subDistrictUnit?: string | null;
  electoralArea?: string | null;
  community?: string | null;
  city?: string | null;
}

export type LocationHierarchyRow = [label: string, value: string];

function display(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

/**
 * Derive City / Town from an MMDA name when a distinct town was not captured.
 * Example: "Accra Metropolitan" → "Accra".
 */
export function deriveCityTown(district?: string | null, community?: string | null): string {
  const communityName = community?.trim() ?? '';
  const stripped = (district ?? '')
    .replace(/\s+(Metropolitan|Municipal|District|Assembly)\b.*$/i, '')
    .trim();

  if (!stripped) {
    return '';
  }

  if (communityName && stripped.toLowerCase() === communityName.toLowerCase()) {
    return '';
  }

  return stripped;
}

/**
 * Official Ghana location cascade for review, print, and agreement documents.
 * City / Town is shown only when it differs from community / suburb.
 */
export function buildLocationHierarchyRows(fields: LocationHierarchyFields): LocationHierarchyRow[] {
  const community = fields.community?.trim() || '';
  const city = fields.city?.trim() || '';
  const cityTown = city && city.toLowerCase() !== community.toLowerCase() ? city : '';

  return [
    ['Region', display(fields.region)],
    ['MMDA / District', display(fields.district)],
    ['Sub-District Unit', display(fields.subDistrictUnit)],
    ['Electoral Area', display(fields.electoralArea)],
    ['Community / Suburb', display(community || city)],
    ['City / Town', display(cityTown)],
  ];
}
