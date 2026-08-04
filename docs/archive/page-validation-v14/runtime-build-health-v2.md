# Runtime & Build Health v2

Recorded: 2026-06-09

---

## Observed symptoms (from logs)

| Symptom | Typical cause |
|---|---|
| `vendor-chunks/concat-map` missing | Stale `.next` cache after dependency graph change |
| `vendor-chunks/listenercount` missing | Same |
| `app/layout.js` 404 | Dev server serving stale manifest while `.next` rebuilt |
| `app/error.js` 404 | Same |
| `main-app.js` 404 | Same |
| Login page chunk 404 | Parallel `dev` + `build` or interrupted build |

**Verdict:** These are **not normal warnings**. They indicate **stale or corrupted build artifacts**, not application route bugs.

---

## Root cause analysis

| Area | Finding |
|---|---|
| Build cache (`.next`) | Primary culprit — chunk manifest out of sync with compiled output |
| Webpack cache (`node_modules/.cache`) | Secondary — can retain stale module graph |
| Dynamic imports | Export engines use lazy `import()` — valid; not causing 404s |
| Route generation | 43 routes compile cleanly after clean rebuild |
| Parallel dev/build | Running both against same `.next` directory causes race corruption |

---

## Clean rebuild procedure

```powershell
cd C:\Users\eddie\Downloads\WILMS
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
npm run type-check
npm run lint
npm run build
npm run dev
```

**Rules:**

1. Stop `dev` before running `build`
2. Delete `.next` after failed or interrupted builds
3. Do not run two Next processes against the same project directory

---

## Validation gate (P11e)

| Check | Result |
|---|---|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass (43 routes, clean `.next` + cache) |
| App lock tests | Pass (7/7) |
| Runtime smoke | Start `npm run dev` after build — avoid parallel dev/build |

---

## Prevention

- Document clean rebuild in CI if chunk errors appear
- Add optional script `"clean": "rimraf .next node_modules/.cache"` (future)
- ChunkLoadError recovery already exists in `app/error.tsx` (P11b)

---

## Sign-off

Build health issues are environmental (cache), not structural App Router defects.
