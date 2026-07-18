# Dependency Report — v1.4 UX Modernisation (Delta)

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Changes this pack

**No dependency version bumps** in this pack. No new runtime packages added for Shadcn/Radix.

## Rationale

Introducing Radix/Shadcn across the monorepo is a breaking UI migration. Prefer consolidating existing primitives first, then adopting Radix behind WILMS wrappers in a dedicated phase.

## Required follow-up (operator/CI)

```bash
npm audit --omit=dev
npm outdated
```

Document deferred breaking upgrades in the next platform PR; do not leave unexplained high/critical CVEs.
