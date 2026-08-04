# P11j Final Verification Report

Date: 2026-06-15  
Scope: Stability, cleanup, validation — no P11i feature rework.

---

## A. Fixed Issues

| Issue | Fix | Files |
|-------|-----|-------|
| Deferred DOM node / focus on detached elements | Guard focus restore and auto-focus with `element.isConnected` | `Modal.tsx`, `Drawer.tsx`, `FocusOnRouteChange.tsx` |
| Deprecated PWA meta (missing replacement) | Added `mobile-web-app-capable`; moved Apple title/status meta to explicit `<head>`; removed `appleWebApp.capable` from Metadata API | `src/app/layout.tsx` |
| Stale build artifacts | Deleted `.next` and `node_modules/.cache` before validation | — |

**Note:** Next.js still emits `<meta name="apple-mobile-web-app-capable">` when `manifest.webmanifest` is linked (observed in production HTML meta stream). The standard `mobile-web-app-capable` tag is now present. Removing the Apple-capable tag entirely would require Next.js/framework changes or dropping the manifest link.

---

## B. Root Causes

### B1. "The deferred DOM Node could not be resolved to a valid node"

**Cause:** `Modal` and `Drawer` called `.focus()` on `previousFocusRef` during unmount cleanup without verifying the node was still in the document. Common when closing overlays opened from mobile nav triggers.

**Fix:** Check `isConnected` before focusing; clear ref before focus to avoid double-restore.

### B2. Static asset 404s (`layout.css`, `main-app.js`, `app-pages-internals.js`, chunk paths)

**Cause:** Development HMR requesting stale chunk names after rebuild, or browser tab pointed at `next dev` while `.next` was regenerated. Production uses hashed paths under `/_next/static/` (e.g. `main-app-5e42ee79a40bb9d5.js`), not bare `main-app.js`.

**Verification:** After clean `npm run build`, production server on port 3001 served `/login` and `/settings` with **17/17** referenced `/_next/*` assets returning HTTP 200.

**Action:** Hard refresh or restart dev server after cache clear; use `npm run start` for production chunk verification.

### B3. `runtime.lastError` / message channel closed

**Cause:** **External (not application code).**

**Evidence:** No `chrome.runtime`, `browser.runtime`, or `sendResponse` async message handlers in `src/`. `ServiceWorkerRegistrar` only registers SW; `CollectorOfflineShell` uses a synchronous `message` listener without `return true`. Pattern matches browser extensions (ad blockers, password managers, React DevTools).

**Action:** Document only; no app code change.

### B4. Meta deprecation warning

**Cause:** Previously `metadata.appleWebApp.capable: true` generated deprecated tag without the newer standard tag.

**Fix:** Explicit `mobile-web-app-capable` in layout head.

---

## C. Validation Results

Clean cycle performed:

1. Stopped conflicting prod start on :3000 (EADDRINUSE — port occupied by existing process)
2. Removed `.next` and `node_modules/.cache`
3. Commands:

| Command | Result |
|---------|--------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass (42 routes) |
| `npm run test` | Pass — **393 tests** (197 + 196 sharded) |
| `npx next start -p 3001` | Pass — pages load, assets 200 |

Toolbar audit: see `P11j-toolbar-verification.md` — all three P11i pages **PASS**.

Incomplete work audit: see `P11j-incomplete-work-audit.md`.

---

## D. Remaining Incomplete Work

See `P11j-incomplete-work-audit.md`. Highlights:

- Production REST API (all domains except auth)
- Group displayName / groupSystemId UI
- Service-layer leader permission enforcement
- Most settings sections read-only
- Collector messaging stub
- SMS/email provider integration

---

## E. Backend Blockers

| Area | Blocked? |
|------|----------|
| All non-auth REST endpoints | Yes |
| Production data mode | Yes |
| Group formation persistence | Yes |
| Settings persistence (beyond mock store) | Yes |
| SMS/email | Yes |
| Mock/demo UI flows | No |

---

## F. Known Non-App Warnings

| Warning | Classification |
|---------|----------------|
| `runtime.lastError` / message channel closed | Browser extension |
| JSDOM "Could not parse CSS stylesheet" in `wilms-export.test.ts` stderr | Test environment (print CSS `@page` rules); tests pass |
| Next.js still outputs `apple-mobile-web-app-capable` alongside manifest | Framework/manifest coupling |
| Port 3000 in use when running `npm run start` | Environment (existing dev/prod process) |

---

## G. Production Readiness Score

**Demo / UI completeness:** 8/10 — Full role shells, mock workflows, exports, tests green.

**Production backend readiness:** 2/10 — Auth routes only; all other services are client stubs pointing at missing API.

**Stability (post-P11j fixes):** 8/10 — Focus/portal safety improved; clean production build serves assets correctly.

**Overall production readiness:** **4/10** — Suitable for demo and frontend integration testing; not ready for live deployment without backend and API wiring.

---

## Files changed in P11j

- `src/components/ui/Modal.tsx`
- `src/components/ui/Drawer.tsx`
- `src/components/accessibility/FocusOnRouteChange.tsx`
- `src/app/layout.tsx`
- `context/page-validation/P11j-toolbar-verification.md` (new)
- `context/page-validation/P11j-incomplete-work-audit.md` (new)
- `context/page-validation/P11j-final-verification.md` (this file)

No P11i layout, export, or dashboard files were modified.
