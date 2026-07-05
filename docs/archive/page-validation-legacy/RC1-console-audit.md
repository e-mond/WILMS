# RC1 ÔÇö Console Audit

**Gate:** GATE 4ÔÇô5  
**Date:** 2026-06-30

---

## Primary defect resolved

`ERR_CONTENT_DECODING_FAILED` on all BFF GETs ÔÇö fixed in GATE 1 (proxy header sanitization).

---

## Remaining console classifications

| Class | Action |
|-------|--------|
| 401 on unauthenticated probe | Expected |
| ResizeObserver loop | Benign (filtered in e2e) |
| favicon 404 | Benign |

---

## Error UX

- `apiClient.ts` maps API errors to user-facing messages
- No stack traces or SQL in client error envelopes
- `QueryStatePanel` provides retry on load failures

---

**Verdict:** Critical decoding errors resolved. E2e functional audit filters benign console noise.
