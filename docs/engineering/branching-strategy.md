# WILMS Branching Strategy

## Protected branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready history (do not commit directly) |
| `release/p14.3a` | P14.3A financial core release line (do not commit directly) |

## Phase branches (P14.3B)

Each P14.3B phase uses a dedicated feature branch:

```text
feature/p14.3b-phase-0   → Performance baseline
feature/p14.3b-phase-1   → Loan pools (read API)
feature/p14.3b-phase-2   → Financial adjustments
feature/p14.3b-phase-3   → Reversals (planned)
feature/p14.3b-phase-4   → Reconciliation (planned)
feature/p14.3b-phase-5   → Write-offs (planned)
```

## Required workflow

```text
Branch
  ↓
Implementation
  ↓
Validation (type-check, lint, build, test, domain verify)
  ↓
Documentation (README, releases, page-validation)
  ↓
Push
  ↓
PR → release/p14.3a
  ↓
Labels + Milestone
  ↓
Review + Merge
```

## Branch creation

```bash
git checkout release/p14.3a
git pull origin release/p14.3a
git checkout -b feature/p14.3b-phase-X
```

When a phase depends on the previous phase still in review, branch from the prior feature branch and rebase onto `release/p14.3a` after merge.

## Pull requests

**Title format:** `[P14.3B-Phase-X] <phase title>`

**Body must include:**

- Summary
- Scope (in / out)
- Validation results
- Risks and known limitations
- Documentation links

**Labels:**

- Always: `enhancement`, `backend`, `financial`, `phase-x`, `documentation`
- When applicable: `performance`, `security`, `database`

**Milestone:** `P14.3B Financial Controls`

## Release notes

Create `docs/releases/P14.3B-Phase-X.md` on every phase with features, validation, known issues, and next-phase objectives.

## Merge policy

- All validation gates green before merge request.
- Certification doc published under `docs/page-validation/`.
- README reflects current production readiness score.
