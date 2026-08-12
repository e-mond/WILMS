# Community Import Process

**Product version:** 1.8.0  
**Language:** British English

## Preconditions

- Node 22+
- `DATABASE_URL` configured for seed/apply steps
- Repository checked out on a feature branch (never mutate `main` directly)

## Steps

1. **Build HOTOSM communities** (no database writes)

```bash
npm run build:hotosm-communities -w @wilms/domain
```

Produces `data/ghana-locations/hotosm-communities.json` with dataset version and source metadata.

2. **Apply schema migration 0043** (aliases + quality runs)

```bash
npm run db:apply:community-location -w @wilms/domain
```

3. **Import hierarchy + communities** (idempotent)

```bash
npm run seed:ghana-hierarchy -w @wilms/domain
```

Imports IMCCOD regions/MMDAs, STMA hierarchy, verified communities, HOTOSM named places, bundled fallbacks, and alias rows.

4. **Validate data quality**

```bash
npm run validate:location-quality -w @wilms/domain
```

Writes `documentation/location/COMMUNITY_DATA_QUALITY_REPORT.md`.

## Safety checklist

| Check | Expected |
|-------|----------|
| Fabricated names | None |
| Snapshot source string | Remains `imccod+stma` for regions/MMDAs |
| HOTOSM source string | `hotosm` |
| Re-run seed | Updates in place; no duplicate UUID explosion |
| Electoral parents for HOTOSM | Always null |

## Failure handling

- Unmatched HOTOSM district names are skipped and counted in build stats.
- Failed quality checks exit non-zero; fix data or aliases before promoting.
