# Settings enforcement audit — WILMS v1.8.0

**Date:** 15 August 2026  
**Version:** v1.8.0 (no bump)  
**Scope:** Authoritative use of Super Admin settings in operational workflows  

## Method

Reviewed `system_settings` columns, the Settings UI (`SettingsSectionViews`), and every domain consumer of `getSettings()` versus process-environment fallbacks.

## Findings

| Setting | Stored | Displayed | Previously enforced | After hotfix |
| --- | --- | --- | --- | --- |
| Min / max group size | Yes | Yes | **No** — grouping used `WILMS_MIN_GROUP_SIZE` / `WILMS_MAX_GROUP_SIZE` env defaults | **Yes** — `getGroupSizeLimits()` |
| Max loan amount | Yes | Yes | **No** at loan create | **Yes** — `createLoan` |
| Default loan duration | Yes | Yes | Used as UI default only (not a hard cap) | Unchanged — default, not a maximum |
| Admin fee | Yes | Yes | Yes (loan approval / disbursement SMS) | Yes |
| Late payment grace days | Yes | Yes | Yes (payments + scheduler) | Yes |
| Payment reminder days | Yes | Yes | Yes (scheduler) | Yes |
| SMS / email / approval SMS flags | Yes | Yes | Yes (`dispatchSms` / templates) | Yes |
| Reconciliation variance % | Yes | Yes | Displayed; variance logic already uses recorded recon fields | No invented extra rule |
| Allow loan rollovers | Yes | Yes | Not used as a hard gate | Not invented as a new product rule |
| Session timeout / 2FA / IP allowlist | Yes | Yes | Auth stack uses dedicated session/security modules | Unchanged |
| GPS verification enabled | Yes | Yes | Registration GPS capture remains available | Reverse geocode added; flag not used to invent a hard block |
| Borrower / guarantor numeric “limits” | Not stored as separate settings | Some copy in loan-roles UI | No extra tables | Group size is the stored capacity rule |

## Group size (root cause)

`packages/domain/src/modules/groups/service.ts` and `group-formation/service.ts` read `env.minGroupSize` / `env.maxGroupSize`. Administrators saving `system_settings.max_group_size` therefore had no effect on assignment or the community formation queue.

## Community formation queue

`processApprovedBorrower` now batches using current `getSettings()` limits. Status API `/groups/formation/config` is async and returns the same values.

## Registration assignment

Approver assignment (`addMember`) rejects with a named capacity message when `memberCount >= maxGroupSize`.
