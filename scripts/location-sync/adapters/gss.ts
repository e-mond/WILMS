import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deriveMmdaCategory,
  snapshotChecksum,
  titleCaseAdministrativeName,
} from '../normalize.js';
import type { LocationSnapshot, LocationSourceAdapter, NormalisedCommunity } from '../types.js';
import {
  GHANA_REGIONS,
  STMA_COMMUNITIES,
  STMA_DISTRICT_SOURCE_ID,
  STMA_ELECTORAL_AREAS,
  STMA_SUB_METROS,
} from '../datasets/stma-hierarchy.js';

const DATASET_VERSION = 'imccod-2026-08-12';

function parseImccodMmdas() {
  const tsvPath = join(dirname(fileURLToPath(import.meta.url)), '../datasets/imccod-mmdas.tsv');
  const lines = readFileSync(tsvPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return lines.map((line) => {
    const [serial, regionCode, officialName, capital] = line.split('|');
    if (!serial || !regionCode || !officialName) {
      throw new Error(`Invalid IMCCOD row: ${line}`);
    }
    return {
      serial: Number(serial),
      regionCode,
      officialName,
      capital: capital ?? '',
    };
  });
}

export const gssAdapter: LocationSourceAdapter = {
  id: 'gss',
  load(): LocationSnapshot {
    const mmdas = parseImccodMmdas();
    if (mmdas.length !== 261) {
      throw new Error(`IMCCOD transcription must contain 261 MMDAs, found ${mmdas.length}`);
    }

    const regions = GHANA_REGIONS.map((region) => ({
      sourceId: `region:${region.code}`,
      code: region.code,
      name: region.name,
    }));

    const districts = mmdas.map((row) => ({
      sourceId: `imccod:${row.serial}`,
      regionCode: row.regionCode,
      name: titleCaseAdministrativeName(row.officialName),
      category: deriveMmdaCategory(row.officialName),
      capital: row.capital,
    }));

    const subDistrictUnits = STMA_SUB_METROS.map((unit) => ({
      sourceId: unit.sourceId,
      districtSourceId: STMA_DISTRICT_SOURCE_ID,
      name: unit.name,
      unitType: unit.unitType,
    }));

    const electoralAreas = STMA_ELECTORAL_AREAS.map((area) => ({
      sourceId: area.sourceId,
      districtSourceId: STMA_DISTRICT_SOURCE_ID,
      subDistrictUnitSourceId: area.subMetro ? `stma:sub-metro:${area.subMetro}` : undefined,
      name: area.name,
      aliases: area.aliases,
    }));

    const communities: NormalisedCommunity[] = [
      ...STMA_ELECTORAL_AREAS.map((area) => ({
        sourceId: `stma:community:${area.sourceId.replace('stma:ea:', '')}`,
        districtSourceId: STMA_DISTRICT_SOURCE_ID,
        electoralAreaSourceId: area.sourceId,
        name: area.name,
        aliases: area.aliases,
      })),
      ...STMA_COMMUNITIES.map((community) => ({
        sourceId: community.sourceId,
        districtSourceId: STMA_DISTRICT_SOURCE_ID,
        electoralAreaSourceId: community.electoralAreaSourceId,
        name: community.name,
        aliases: community.aliases,
      })),
    ];

    const snapshot = {
      source: 'imccod+stma',
      datasetVersion: DATASET_VERSION,
      regions,
      districts,
      subDistrictUnits,
      electoralAreas,
      communities,
    };

    return { ...snapshot, checksum: snapshotChecksum(snapshot) };
  },
};
