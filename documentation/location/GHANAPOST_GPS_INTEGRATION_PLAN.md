# GhanaPost GPS integration — next sprint plan (planning only)

**Status:** Planning. **Do not implement in v1.8.1.**  
**Do not** add API keys, environment variables, or database migrations in this document’s sprint.

## Current state (v1.8.1)

WILMS already stores GPS coordinates on registration and collection workflows and can derive a **placeholder** Ghana Digital Address (`XX-NNN-NNNN`) from region prefix and coordinates via `GET /locations/reverse-geocode` and `packages/domain/src/modules/locations/digital-address.ts`. That encoding is **not** an official GhanaPost address.

## Goal of the next sprint

Replace or supplement the placeholder with official GhanaPost GPS (Ghana Digital Address) lookup when a product credential is available, without changing lending business rules.

## Proposed architecture (not built)

1. **Boundary:** a single domain adapter (e.g. `packages/domain/src/infrastructure/ghanapost/`) that calls GhanaPost over HTTPS. Route handlers and UI must not call GhanaPost directly.
2. **Input:** latitude / longitude from an existing capture (registration “Use current GPS”, group collection GPS).
3. **Output:** official digital address string plus any locality fields GhanaPost returns. Map onto existing borrower `gpsAddress` / coordinate fields; avoid a second source of truth.
4. **Fallback:** if the provider is unconfigured, times out, or returns no match, keep coordinates and the existing placeholder encoder. Never block registration solely because GhanaPost is down.
5. **Settings:** Super Admin enable/disable plus credential storage via existing secrets/env pattern — **keys stay in the host environment, never in git**.
6. **Audit:** record provider success/failure without storing the API key.

## Data / migration (deferred)

A later sprint may add a nullable `digitalAddressSource` (`placeholder` | `ghanapost`) if operations need to distinguish official vs fallback codes. **No migration in this plan.**

## Security

- Server-side only; no public client key.
- Rate-limit reverse geocode.
- Do not log full request secrets.

## Out of scope until product owner approves

- GhanaPost account provisioning
- Committing API keys
- Changing group assignment or SMS rules
- New product modules

## Suggested first implementation slice (after this plan is approved)

1. Credential + feature flag in environment (not committed).
2. Adapter with timeout and typed errors.
3. Wire `reverse-geocode` to try GhanaPost then fallback.
4. Operator smoke: one registration with GPS on staging.
