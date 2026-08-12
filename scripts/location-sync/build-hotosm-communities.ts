/**
 * Build compact HOTOSM community rows from the verified HDX export.
 * Source: https://data.humdata.org/dataset/hotosm_gha_populated_places
 * Snapshot: 2026-08-07 — ODC-ODbL.
 *
 * Only named features are kept. Parents are matched to IMCCOD MMDAs by
 * normalised adm2_name. Electoral areas are never invented.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normaliseMatchKey, titleCaseAdministrativeName } from './normalize.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const RAW_DIR = join(ROOT, 'data/ghana-locations/raw');
const OUT_PATH = join(ROOT, 'data/ghana-locations/hotosm-communities.json');
const GEOJSON_PATH = join(RAW_DIR, 'populated_places.geojson');
const DATASET_VERSION = 'hotosm-2026-08-07';

const ACCEPTED_PLACES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'suburb',
  'neighbourhood',
  'neighborhood',
  'quarter',
]);

interface ImccodRow {
  serial: number;
  regionCode: string;
  officialName: string;
  capital: string;
}

interface HotosmCommunityRow {
  sourceId: string;
  name: string;
  aliases: string[];
  districtName: string;
  districtSourceId: string;
  regionName: string | null;
  latitude: number | null;
  longitude: number | null;
  geometryRef: string;
  placeType: string | null;
}

function parseImccod(): ImccodRow[] {
  const tsvPath = join(dirname(fileURLToPath(import.meta.url)), 'datasets/imccod-mmdas.tsv');
  return readFileSync(tsvPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [serial, regionCode, officialName, capital] = line.split('|');
      return {
        serial: Number(serial),
        regionCode: regionCode!,
        officialName: officialName!,
        capital: capital ?? '',
      };
    });
}

function centroid(geometry: { type: string; coordinates: unknown }): { lat: number; lng: number } | null {
  if (!geometry) {
    return null;
  }
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates as number[];
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    const ring = (geometry.coordinates as number[][][])[0] ?? [];
    if (ring.length === 0) {
      return null;
    }
    let sumLat = 0;
    let sumLng = 0;
    for (const point of ring) {
      sumLng += point[0] ?? 0;
      sumLat += point[1] ?? 0;
    }
    return { lat: sumLat / ring.length, lng: sumLng / ring.length };
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    const first = (geometry.coordinates as number[][][][])[0]?.[0] ?? [];
    if (first.length === 0) {
      return null;
    }
    let sumLat = 0;
    let sumLng = 0;
    for (const point of first) {
      sumLng += point[0] ?? 0;
      sumLat += point[1] ?? 0;
    }
    return { lat: sumLat / first.length, lng: sumLng / first.length };
  }
  return null;
}

function main(): void {
  const allowEmpty = process.argv.includes('--allow-empty');
  if (!existsSync(GEOJSON_PATH)) {
    const message = `HOTOSM GeoJSON not found at ${GEOJSON_PATH}. Download the HDX export first.`;
    if (allowEmpty) {
      writeFileSync(OUT_PATH, '[]\n', 'utf8');
      console.log(JSON.stringify({ ok: true, empty: true, message }, null, 2));
      return;
    }
    console.error(message);
    process.exit(1);
  }

  const imccod = parseImccod();
  const districtByKey = new Map<string, ImccodRow>();
  for (const row of imccod) {
    districtByKey.set(normaliseMatchKey(row.officialName), row);
  }

  console.log('Parsing HOTOSM GeoJSON…');
  const geojson = JSON.parse(readFileSync(GEOJSON_PATH, 'utf8')) as {
    features: Array<{
      properties?: Record<string, string | null>;
      geometry?: { type: string; coordinates: unknown };
    }>;
  };

  const rows: HotosmCommunityRow[] = [];
  const seen = new Set<string>();
  let skippedUnnamed = 0;
  let skippedPlaceType = 0;
  let skippedUnmatchedDistrict = 0;
  let skippedDuplicate = 0;

  for (const feature of geojson.features ?? []) {
    const props = feature.properties ?? {};
    const rawName = (props.name ?? props.name_en ?? props.name_latin ?? '').toString().trim();
    if (!rawName) {
      skippedUnnamed += 1;
      continue;
    }

    const place = (props.place ?? '').toString().toLowerCase();
    const landuse = (props.landuse ?? '').toString().toLowerCase();
    if (place && !ACCEPTED_PLACES.has(place) && !(landuse === 'residential' && place === '')) {
      // Keep named residential landuse without place tag; reject other place tags.
      if (landuse !== 'residential' || place) {
        skippedPlaceType += 1;
        continue;
      }
    }
    if (!place && landuse !== 'residential') {
      skippedPlaceType += 1;
      continue;
    }

    const adm2Name = (props.adm2_name ?? '').toString().trim();
    if (!adm2Name) {
      skippedUnmatchedDistrict += 1;
      continue;
    }
    const district = districtByKey.get(normaliseMatchKey(adm2Name));
    if (!district) {
      skippedUnmatchedDistrict += 1;
      continue;
    }

    const osmId = (props.id ?? props.osm_id ?? rawName).toString();
    const sourceId = `hotosm:${osmId}`;
    const dedupeKey = `${district.serial}:${normaliseMatchKey(rawName)}`;
    if (seen.has(dedupeKey)) {
      skippedDuplicate += 1;
      continue;
    }
    seen.add(dedupeKey);

    const centre = centroid(feature.geometry as { type: string; coordinates: unknown });
    const aliases = new Set<string>();
    for (const candidate of [props.name_en, props.name_latin]) {
      const value = (candidate ?? '').toString().trim();
      if (value && normaliseMatchKey(value) !== normaliseMatchKey(rawName)) {
        aliases.add(value);
      }
    }

    rows.push({
      sourceId,
      name: titleCaseAdministrativeName(rawName),
      aliases: [...aliases],
      districtName: titleCaseAdministrativeName(district.officialName),
      districtSourceId: `imccod:${district.serial}`,
      regionName: (props.adm1_name ?? null) as string | null,
      latitude: centre?.lat ?? null,
      longitude: centre?.lng ?? null,
      geometryRef: `hotosm:${osmId}`,
      placeType: place || landuse || null,
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name) || a.districtName.localeCompare(b.districtName));

  const payload = {
    source: 'hotosm',
    datasetVersion: DATASET_VERSION,
    license: 'ODC-ODbL',
    generatedAt: new Date().toISOString(),
    checksum: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
    stats: {
      featureCount: geojson.features?.length ?? 0,
      imported: rows.length,
      skippedUnnamed,
      skippedPlaceType,
      skippedUnmatchedDistrict,
      skippedDuplicate,
      distinctDistricts: new Set(rows.map((row) => row.districtSourceId)).size,
    },
    communities: rows,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  console.log(JSON.stringify({ ok: true, out: OUT_PATH, stats: payload.stats }, null, 2));
}

main();
