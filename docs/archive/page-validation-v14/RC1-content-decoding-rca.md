# RC1 — Content Decoding Root Cause Analysis

**Gate:** GATE 1  
**Date:** 2026-06-30  
**Status:** RESOLVED

---

## Symptom

Browser DevTools reported `ERR_CONTENT_DECODING_FAILED` on BFF-proxied API calls while HTTP status was **200 OK**:

- `/api/wilms/dashboard/summary`
- `/api/wilms/borrowers`
- `/api/wilms/loan-pools`
- `/api/wilms/loans/portfolio`
- `/api/wilms/collectors`
- `/api/wilms/groups`
- `/api/wilms/settings`
- `/api/wilms/risk`
- `/api/wilms/applications`

---

## Root cause

The Next.js BFF proxy at `apps/frontend/src/app/api/wilms/[...path]/route.ts` buffered upstream responses with `arrayBuffer()`. Node fetch **auto-decompresses** gzip/brotli bodies during buffering, but the proxy forwarded upstream headers unchanged — including `Content-Encoding: gzip` and stale `Content-Length`.

Browsers attempted to gzip-decode plaintext JSON → `ERR_CONTENT_DECODING_FAILED`.

Express backend has **no** application-level compression middleware; compression originated from upstream/platform when `Accept-Encoding` was forwarded from the browser.

---

## Fix

| Change | File |
|--------|------|
| Strip `content-encoding`, `content-length`, `transfer-encoding` from proxy responses | `apps/frontend/src/lib/api/proxy-headers.ts` |
| Force `Accept-Encoding: identity` on upstream fetch | Same |
| Unit tests for header sanitizer | `apps/frontend/src/tests/lib/api-proxy-headers.test.ts` |

---

## Evidence (pre-fix)

```text
curl.exe -sD - -H "Accept-Encoding: gzip" https://wilms.vercel.app/api/wilms/health

HTTP/1.1 200 OK
Content-Encoding: gzip
Content-Type: application/json; charset=utf-8
```

Body was readable JSON when fetched without browser decode — header/body mismatch confirmed.

---

## Evidence (post-fix)

After deploy, BFF responses must:

1. Return valid JSON parseable by `curl` and browser `fetch`
2. Not include `Content-Encoding: gzip` when body is decompressed JSON
3. Load affected admin pages without decoding errors in DevTools

Verification commands:

```bash
curl.exe -sD - -H "Accept-Encoding: gzip" https://wilms.vercel.app/api/wilms/health
node -e "fetch('https://wilms.vercel.app/api/wilms/health').then(r=>r.json()).then(console.log)"
```

---

## Related cleanup

Removed P14.6.4 silent API fallbacks per golden rule:

- `useNotificationInbox.ts` — direct `getUnreadCount()` query
- `DailyCollectionReportPanel.tsx` — direct `listCollectors()` query

---

**GATE 1 verdict:** Root cause identified and fixed. Proceed to GATE 2 after production deploy verification.
