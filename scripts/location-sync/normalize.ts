import { createHash } from 'node:crypto';
import type { LocationSnapshot, MmdaCategory } from './types.js';

export function titleCaseAdministrativeName(value: string): string {
  return value
    .replace(/\bMUNICPAL\b/gi, 'MUNICIPAL')
    .toLowerCase()
    .replace(/(^|[\s\-\/(),.])([a-z])/g, (_match, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`)
    .replace(/\s+/g, ' ')
    .trim();
}

export function deriveMmdaCategory(officialName: string): MmdaCategory {
  const upper = officialName.toUpperCase();
  if (upper.includes('METROPOLITAN')) {
    return 'Metropolitan';
  }
  if (upper.includes('MUNICIPAL') || upper.includes('MUNICPAL')) {
    return 'Municipal';
  }
  return 'District';
}

export function normaliseMatchKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/metropolitan assembly|municipal assembly|district assembly/g, '')
    .replace(/metropolitan|metropolis|metro|municipal|district/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function snapshotChecksum(snapshot: Omit<LocationSnapshot, 'checksum'>): string {
  const payload = JSON.stringify({
    source: snapshot.source,
    datasetVersion: snapshot.datasetVersion,
    regions: snapshot.regions,
    districts: snapshot.districts,
    subDistrictUnits: snapshot.subDistrictUnits,
    electoralAreas: snapshot.electoralAreas,
    communities: snapshot.communities,
  });
  return createHash('sha256').update(payload).digest('hex');
}
