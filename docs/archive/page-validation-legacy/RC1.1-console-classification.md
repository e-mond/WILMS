# RC1.1 ÔÇö Console Error Classification

**Date:** 2026-07-01

## Application defects (investigated / resolved)

| Error | Root cause | Status |
|-------|------------|--------|
| `ERR_CONTENT_DECODING_FAILED` on BFF routes | Proxy forwarded `Content-Encoding: gzip` on decompressed body | **Fixed** ÔÇö `proxy-headers.ts` |
| `ChunkLoadError` / stale bundle | Post-deploy JS chunk mismatch | **Mitigated** ÔÇö `error.tsx` reload, SW v2 cache bust, `controllerchange` reload |
| Collector 403 on unrelated APIs | Router-level RBAC bleed | **Fixed** ÔÇö hotfix `8e0df23` |

## Not application defects

| Console message | Classification | Evidence |
|-----------------|----------------|----------|
| `background.js` ÔÇö `Cannot destructure property 'url'` | **Browser extension** | Stack references extension script, not `apps/frontend/src` |
| `runtime.lastError` ÔÇö message channel closed | **Extension / DevTools** | Occurs when extension popup closes mid-message |
| `ResizeObserver loop` | Benign browser warning | No functional impact |
| `favicon.ico` 404 | Missing asset | Cosmetic |

## Reproduction (extension noise)

1. Open production app with extensions enabled ÔåÆ observe `background.js` errors.
2. Open incognito with extensions disabled ÔåÆ errors absent.
3. Document in browser DevTools ÔåÆ Sources: no WILMS bundle in stack for extension errors.

## Policy

Do not suppress or hide console errors in application code. Classify and document. Fix only when stack trace originates from WILMS source.
