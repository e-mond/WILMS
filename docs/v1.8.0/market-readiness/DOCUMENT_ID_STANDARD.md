# Document ID Standard

**Version:** v1.8.0  
**Classification:** Confidential

---

Official identifiers on screens, print, and exports. Raw UUIDs must not appear on borrower-facing or printed documents.

| Entity | Pattern | Example |
|--------|---------|---------|
| Borrower | `BRW-YYYY-NNNNN` | `BRW-2026-00417` |
| Loan | `LN-YYYY-NNNNN` | `LN-2026-00124` |
| Collector | Full name and code | `Kwame Mensah (COL-012)` |
| Group | `GRP-YYYY-NNN` | `GRP-2026-001` |
| Payment | `TXN-YYYYMMDD-NNN` | `TXN-20260815-002` |

Year is taken from registration or loan start date. Sequence is zero-padded.

Legacy prefixes `BWR-` and `LOAN-` remain recognised as readable IDs so historical records do not display as UUIDs.

Implementation: `packages/shared-utils/src/display-ids.ts`.
