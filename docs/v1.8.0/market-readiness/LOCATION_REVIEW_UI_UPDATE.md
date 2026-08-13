# Location Review UI Update

**Version:** v1.8.0  
**Classification:** Confidential

---

## Purpose

Registration Review and Approver Application Review must show the official Ghana location cascade, including community and city.

## Cascade

| Order | Label | Source |
|------:|-------|--------|
| 1 | Region | `region` |
| 2 | MMDA / District | `district` |
| 3 | Sub-District Unit | `subDistrictUnit` |
| 4 | Electoral Area | `electoralArea` |
| 5 | Community / Suburb | `community` (form field `city` is community) |
| 6 | City / Town | Distinct town name; omitted when it equals community |

City / Town is derived from the MMDA name when it is not captured separately (for example Accra Metropolitan → Accra).

## Screens

| Screen | Component |
|--------|-----------|
| Registration Officer — My Registrations detail | `BorrowerReviewProfile` / registration agreement |
| Approver — Pending application review | `PendingApplicationReview` → `BorrowerReviewProfile` |
| Printed / exported agreement | `buildRegistrationAgreementContent` |

Helper: `buildLocationHierarchyRows` in `apps/frontend/src/utils/location-hierarchy.ts`.
