# Ghana Import Report

**Product version:** 1.8.0  
**Dataset version:** `imccod-2026-08-12`  
**Language:** British English

| Level | Rows in snapshot | Source | Coverage |
|-------|------------------|--------|----------|
| Regions | 16 | Existing official region list | Complete |
| MMDAs | 261 | [IMCCOD MMDA register](https://imccod.gov.gh/mmdas/) | Complete |
| Sub-district units | 3 | STMA / GNA | STMA only |
| Electoral areas | 36 | [STMA Assembly Members](https://stma.gov.gh/assembly-members.php) | STMA only |
| Verified STMA communities | electoral-area labels plus sub-metro neighbourhoods named on STMA pages | STMA sub-metro pages | STMA only |
| Bundled communities | preserved from `data/ghana-locations/cities.json` | Existing seed | Partial national |

Checksum is stored on `location_sync_log.checksum`.

Names **not** imported because they were not on the reviewed STMA pages: European Town, Old Sekondi / Town Centre.
