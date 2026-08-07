# WILMS v1.7.3 Release Pack

**Release:** Documentation Suite  
**Branch:** `feature/v1.7.3-documentation-suite`  
**Date:** August 2026

---

## Summary

Release v1.7.3 delivers the official WILMS documentation library. Platform feature development completed at v1.7.2. This release adds structured documentation, branded PDF/DOCX generation, and removes the standalone Export Center in favour of contextual exports.

---

## Documentation library

All sources live under [`documentation/`](../../documentation/):

| Resource | Location |
|----------|----------|
| Master index | [`documentation/DOCUMENTATION_LIBRARY_INDEX.md`](../../documentation/DOCUMENTATION_LIBRARY_INDEX.md) |
| Sprint report | [`documentation/FINAL_DOCUMENTATION_REPORT.md`](../../documentation/FINAL_DOCUMENTATION_REPORT.md) |
| Product book | [`documentation/books/WILMS_PRODUCT_BOOK.md`](../../documentation/books/WILMS_PRODUCT_BOOK.md) |
| Generated PDFs | [`documentation/pdf/`](../../documentation/pdf/) |
| Generated DOCX | [`documentation/docx/`](../../documentation/docx/) |
| Web portal structure | [`documentation/web/`](../../documentation/web/) |

---

## Generate artefacts

```bash
npm run docs:generate
```

---

## Product change

| Change | Detail |
|--------|--------|
| Export Center removal | Standalone `/exports` route and sidebar nav removed |
| Contextual exports | Primary export pattern from reports, profiles, executive intelligence |
| Export job API | Retained at `/exports/jobs` for embedded flows |

No financial, RBAC, or notification code changes.

---

## Previous release packs

| Version | Pack |
|---------|------|
| v1.7.2 | [`docs/v1.7.2/`](../v1.7.2/) — last feature platform release |
| v1.7.1 | [`docs/v1.7.1/`](../v1.7.1/) |
| v1.7.0 | [`docs/v1.7/`](../v1.7/) |

---

## Version artefacts

- [`VERSION.md`](../../VERSION.md)
- [`CHANGELOG.md`](../../CHANGELOG.md)

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
