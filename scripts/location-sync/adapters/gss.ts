import { existsSync, readFileSync } from 'node:fs';
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

/** Keep stable — changing this rewrites UUID seeds for regions/MMDAs. */
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

    const capitalCommunities: NormalisedCommunity[] = mmdas
      .filter((row) => row.capital.trim().length > 0)
      .map((row) => ({
        sourceId: `imccod:capital:${row.serial}`,
        districtSourceId: `imccod:${row.serial}`,
        name: titleCaseAdministrativeName(row.capital),
        aliases: [row.capital.trim()].filter(
          (alias) => alias.toLowerCase() !== titleCaseAdministrativeName(row.capital).toLowerCase(),
        ),
      }));

    const stmaCommunities: NormalisedCommunity[] = [
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

    const communities: NormalisedCommunity[] = [...capitalCommunities, ...stmaCommunities];

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

export function loadHotosmCommunityDataset(): {
  datasetVersion: string;
  communities: NormalisedCommunity[];
} {
  const path = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../data/ghana-locations/hotosm-communities.json',
  );
  if (!existsSync(path)) {
    return { datasetVersion: 'hotosm-2026-08-07', communities: [] };
  }
  const payload = JSON.parse(readFileSync(path, 'utf8')) as {
    datasetVersion?: string;
    communities?: Array<{
      sourceId: string;
      name: string;
      aliases?: string[];
      districtSourceId: string;
      latitude?: number | null;
      longitude?: number | null;
      geometryRef?: string;
    }>;
  };
  return {
    datasetVersion: payload.datasetVersion ?? 'hotosm-2026-08-07',
    communities: (payload.communities ?? []).map((row) => ({
      sourceId: row.sourceId,
      districtSourceId: row.districtSourceId,
      name: row.name,
      aliases: row.aliases ?? [],
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      geometryRef: row.geometryRef,
    })),
  };
}
