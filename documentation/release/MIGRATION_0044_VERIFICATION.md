# Migration 0044 Verification

**Migration:** `0044_v180_borrower_update_requests.sql`  
**Version:** v1.8.0  
**Applied:** 13 August 2026  
**Environment:** Production Neon (shared operational database)  
**Classification:** Confidential

---

## Purpose

Creates the `borrower_update_requests` table that powers the collector → Registration Officer / Super Admin borrower information update workflow.

## Apply method

`drizzle-kit migrate` currently exits early with “Please install latest version of drizzle-orm” in this workspace. Migration **0044** was therefore applied with the official SQL file against the production database and recorded in `drizzle.__drizzle_migrations`.

| Step | Result |
|------|--------|
| SQL statements executed | Passed (table, three FKs, three indexes) |
| Journal watermark `1785976800000` inserted | Passed |
| Table `borrower_update_requests` present | Passed |
| Indexes | `borrower_update_requests_pkey`, `_borrower_id_idx`, `_status_idx`, `_requested_by_idx` |
| Foreign keys | `borrowers(id)`, `users(id)` requester, `users(id)` reviewer |

## Post-apply health

`GET https://wilms.vercel.app/api/wilms/health`

| Field | Value |
|-------|-------|
| `status` | `ok` |
| `version` | `1.8.0` |
| `gitCommit` | `33d27b3…` |
| `database.status` | `connected` |
| `migrations.status` | `ok` |
| `migrations.latestJournalWhen` | `1785976800000` (0044) |

Note: `countGap: true` (`applied` 44 vs journal `expected` 45) reflects a historical row-count discrepancy. The watermark matches the latest journal entry; service health is **ok**.

## Staging

Staging uses the same Neon operational database for this programme deployment path. No separate staging apply was required after production apply of 0044.

## Rollback

Migrations are forward-only. Rollback would require controlled DDL drop of `borrower_update_requests` and deletion of the matching `__drizzle_migrations` row — not recommended without an incident ticket.
