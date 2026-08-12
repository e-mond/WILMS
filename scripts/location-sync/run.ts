import { loadValidatedSnapshot } from './pipeline.js';

const adapterId = process.argv[2] ?? process.env.WILMS_LOCATION_ADAPTER ?? 'gss';
const snapshot = await loadValidatedSnapshot(adapterId);
console.log(
  JSON.stringify(
    {
      adapter: adapterId,
      source: snapshot.source,
      datasetVersion: snapshot.datasetVersion,
      checksum: snapshot.checksum,
      regions: snapshot.regions.length,
      districts: snapshot.districts.length,
      subDistrictUnits: snapshot.subDistrictUnits.length,
      electoralAreas: snapshot.electoralAreas.length,
      communities: snapshot.communities.length,
    },
    null,
    2,
  ),
);
