# Community Location Guide

**Product version:** 1.8.0  
**Language:** British English

## Purpose

WILMS registers every borrower against a real Ghanaian community (suburb, village, or neighbourhood) within the official administrative hierarchy.

## Selection flow

```text
Region
  → MMDA
    → Sub-District Unit   (shown only when the MMDA has units)
      → Electoral Area    (shown only when units/areas exist)
        → Community       (searchable autocomplete; required)
          → Street / landmark (free text)
```

## Operator rules

| Rule | Behaviour |
|------|-----------|
| Search | Prefix, substring, alias, case-insensitive; typo tolerance via trigram similarity |
| Missing community | Use **Suggest new community** — enters Super Admin approval; never auto-created |
| Offline | Cascade lists and local options remain available from IndexedDB cache |
| Existing borrowers | Legacy name fields and UUID FKs remain valid |

## STMA examples

Sekondi, Takoradi, Kweikuma, Fijai, Adiembra, Bakado, Bakaekyir, Nkontompo, Ngyiresia, Essaman, European Town, Railway & Harbour, Zongo, Estate, Mempeasem.

## Related documents

- `COMMUNITY_IMPORT_PROCESS.md`
- `COMMUNITY_SEARCH_ARCHITECTURE.md`
- `COMMUNITY_DATA_QUALITY.md`
- `COMMUNITY_SUGGESTION_WORKFLOW.md`
