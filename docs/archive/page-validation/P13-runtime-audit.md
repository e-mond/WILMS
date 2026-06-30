# P13 Runtime Warning Audit

Audit date: 2026-06-15. Codebase search + E2E execution observations.

---

## DevRootNotFoundBoundary

| Item | Finding |
|------|---------|
| In app source | **Not found** — no references under `src/` |
| Origin | Next.js App Router internal dev overlay when route tree mismatch occurs |
| App responsible? | **No direct app code** — would surface only if route/layout misconfiguration triggers Next dev boundary |
| Fixed? | N/A — not reproduced in `npm run build` (success) or unit tests |

---

## Deferred DOM Node warning

| Item | Finding |
|------|---------|
| In app source | **Not found** |
| Typical cause | Browser/extension or React devtools timing warning when DOM node removed before paint |
| App responsible? | **Not verified** — no reproduction steps captured in this audit |
| Fixed? | Not applicable |

---

## runtime.lastError browser warning

| Item | Finding |
|------|---------|
| In app source | **Not found** |
| Typical cause | Chrome extension messaging (`runtime.lastError` unset after async call) |
| App responsible? | **No** — extension/browser layer |
| Fixed? | Not app scope |

---

## Stale `.next` chunk 404 issues

| Item | Finding |
|------|---------|
| Mitigation in repo | `playwright.config.ts` L10–11: E2E uses port **3001** explicitly to avoid conflicting with developer `npm run dev` on **3000** and stale chunk serving |
| App responsible? | **Partially mitigated** in E2E config only |
| Reproducibility | Documented risk when wrong port/server reused; E2E failures (153/156) consistent with wrong/stale server on 3001 when `reuseExistingServer: true` |
| Fixed? | **Not fixed in this follow-up** — environment/process management issue |

---

## Playwright / Node warnings (observed during E2E)

```
Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
```

| Item | Finding |
|------|---------|
| App responsible? | **No** — Playwright/Node CLI color handling |
| Impact | None on test logic |

---

## Unit test stderr (non-failing)

`wilms-export.test.ts` logs jsdom `window.print` / CSS `@page` parse errors — tests still pass (8/8). Pre-existing; not runtime production issue.

---

## Summary

No verified app-code defects for the four named warning categories. E2E login failures align with **web server / port reuse** environment issue, not application runtime errors in source.
