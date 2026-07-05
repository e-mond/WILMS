# Document Archive Report

**Date:** 2026-07-05

## Archived locations

| Source | Destination | Reason |
|--------|-------------|--------|
| Root RC1/v1.0.0 reports | docs/archive/v1.0.0-rc1.4/ | Historical release evidence; root kept for current docs only |
| docs/page-validation/ | docs/archive/page-validation/ | Historical phase validation, recovery, smoke, and certification evidence |

## Policy

Historical evidence was moved, not deleted. Current authoritative docs remain at the root or under docs/architecture, docs/engineering, docs/deployment-guide.md, and docs/security-guide.md.

## Verification note

Scripts that previously generated into docs/page-validation/ now write to docs/generated/, preserving reproducibility without recreating historical folders.