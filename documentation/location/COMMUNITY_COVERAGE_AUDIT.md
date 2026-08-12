# Community Coverage Audit

**Product version:** 1.8.0  
**Sprint:** Community-level location completion (limited scope)  
**Generated:** 2026-08-12  
**Language:** British English  
**Machine artefact:** `data/ghana-locations/community-coverage-audit.json`

## Scope

This audit measures **community / suburb / village / neighbourhood** coverage only. It does not assess GIS polygons, heatmaps, collector territory analytics, or executive geographic dashboards.

## Hierarchy under test

```text
Region
  └─ MMDA (Metropolitan / Municipal / District Assembly)
       └─ Sub-District Unit (optional; skip when empty)
            └─ Electoral Area (optional; skip when empty)
                 └─ Community / suburb / neighbourhood
                      └─ Street / landmark (free text on borrower)
```

## Headline coverage

| Layer | Imported | Expected / notes |
|-------|---------:|------------------|
| Regions | 16 | 16 |
| MMDAs | 261 | 261 (IMCCOD register) |
| Sub-district units | 3 | STMA sub-metros verified; national gazetteer deferred |
| Electoral areas | 36 | STMA verified set only |
| Verified snapshot communities | 313 | IMCCOD capitals + STMA electoral/community names |
| HOTOSM named places matched to MMDAs | 7,130 | Across 221 distinct MMDAs |
| STMA explicit neighbourhood extras | 16 | European Town, Essaman, Sekondi, Bakado, … |

## Duplicate community names

| Finding | Count | Treatment |
|---------|------:|-----------|
| Duplicate display names inside the verified snapshot (case-insensitive) | 4 | Allowed when distinct `sourceId` values; operator review via data-quality job |
| Same name across different MMDAs (e.g. Zongo) | common | Expected and valid |

## Alias gaps

| Pattern | Status |
|---------|--------|
| STMA electoral-area aliases (spelling variants) | Seeded into `communities.aliases` and `location_aliases` |
| HOTOSM `name` / `name:en` variants | Captured when present in GeoJSON properties |
| Unverified colloquial names (e.g. Old Sekondi) | **Gap** — use Suggest New Community |

## Example locality checklist (Western Region / STMA focus)

| Locality | Verified snapshot | HOTOSM | Status |
|----------|:-----------------:|:------:|--------|
| Sekondi | yes | yes | Covered |
| Takoradi | yes | yes | Covered |
| Kweikuma | yes | no | Covered (STMA) |
| Fijai | yes | no | Covered (STMA) |
| Adiembra | yes | yes | Covered |
| Bakado | yes | no | Covered (STMA) |
| Bakaekyir | yes | no | Covered (STMA) |
| Nkontompo | yes | no | Covered (STMA) |
| Ngyiresia | yes | no | Covered (STMA) |
| Essaman | yes | yes | Covered |
| European Town | yes | no | Covered (STMA AAP / news) |
| Old Sekondi | no | no | **Gap** — suggestion workflow |
| Railway & Harbour Area | alias of Railway & Harbour | no | Covered via alias |
| Zongo | yes | no | Covered (STMA) |
| Estate | yes | no | Covered (STMA) |
| Mempeasem | yes | no | Covered (STMA) |

## Registration dependencies

| Dependency | Requirement |
|------------|-------------|
| `BorrowerRegistrationWizard` | Full cascade with skip-empty levels; searchable community selector |
| Community suggestion API | Pending approval only; never auto-create |
| Offline location cache | Region / MMDA / community lists cached in IndexedDB |

## Borrower dependencies

| Field / column | Role |
|----------------|------|
| `region`, `district`, `city` (legacy names) | Display and offline-tolerant registration payloads |
| `region_id`, `district_id`, `community_id` | Canonical FKs when master is available |
| Existing records | Remain valid; no forced remapping in this sprint |

## Group dependencies

| Field / column | Role |
|----------------|------|
| `community_id` / `district_id` | Group placement in hierarchy |
| Missing community FK | Reported by community data-quality validation |

## Remaining coverage gaps (accepted for this sprint)

1. **Old Sekondi** — not found as a verified official community name; officers may suggest it.
2. **~40 MMDAs** without HOTOSM named-place matches after district-name normalisation (HOTOSM covers 221 of 261).
3. **Electoral areas outside STMA** — deferred until a licensed Electoral Commission national file is available.
4. **Sub-district units outside STMA** — deferred pending national gazetteer licensing.

## Conclusion

Verified administrative communities plus HOTOSM named places provide national MMDA-linked community selection suitable for production registration. Gaps are explicit, non-fabricated, and routed through the existing suggestion workflow.
