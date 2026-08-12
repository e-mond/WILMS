# Community Data Quality Report

**Product version:** 1.8.0  
**Generated:** 2026-08-12T21:23:18.445Z  
**Status:** PASSED  
**Language:** British English

## Counts

| Entity | Count |
|--------|------:|
| Regions | 16 |
| MMDAs | 272 |
| Sub-district units | 3 |
| Electoral areas | 36 |
| Communities | 7414 |
| Aliases | 813 |
| MMDAs with at least one community | 272 |

## Integrity

| Check | Result |
|-------|-------:|
| Orphan districts | 0 |
| Orphan communities | 0 |
| Communities with missing electoral-area FK | 0 |
| Invalid coordinates | 0 |
| Duplicate community names within an MMDA | 0 |
| Duplicate aliases | 0 |
| Borrowers linked to missing communities | 0 |
| Groups linked to missing communities | 0 |

## Coverage / resolution gaps

| Gap | Value |
|-----|------:|
| Borrowers without location UUIDs | 0 |
| Groups without community UUID | 0 |
| Electoral areas outside STMA | expected until EC national file |

Duplicate names across different MMDAs are allowed (for example multiple communities named Zongo). Same-MMDA duplicates are reported for operator review and are not treated as hard failures when source datasets retain distinct source IDs.
