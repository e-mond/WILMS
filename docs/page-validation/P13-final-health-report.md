# P13 Final Health Report

Audit date: 2026-06-15.

---

## Validation summary

| Check | Result |
|-------|--------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass (Next.js 14.2.18, 42 routes) |
| `npm run test` | **400 passed** |
| `npm run test:e2e` | **153 failed, 2 passed, 1 skipped** |

---

## 1. Hardcoded data audit

**Scope:** `src/features/**`, `src/components/**`

**Method:** Pattern search for static KPI values, fake percentages, hardcoded counts.

**Findings:**

| Finding | Severity | Evidence |
|---------|----------|----------|
| KPI cards use **computed data** from hooks/services | OK | e.g. `BorrowerList.tsx` — `summary.totalBorrowers` from filtered data |
| Filter threshold labels (e.g. `≥ 90%`, `< 70%`) | OK — UI copy for filters | `CollectorsManagementPanel.tsx`, `CollectorsAsidePanel.tsx` |
| CSS `%` in print/export engines | OK — layout | `print-engine.ts` |
| Demo **reference constants** for collector scale | Expected for mock | `constants/collectors-reference-scale.ts` (used by factories, not inline in feature KPI components) |
| Settings form `<option value="30">` | OK — form options | `SettingsPanel.tsx` |

**No verified fake statistics embedded in feature KPI components** — counts and percentages originate from service/mock responses or derived state.

---

## 2. Direct mock imports audit

**Rule:** No `src/features/**` or `src/components/**` imports from `src/services/mock/*`.

**Result:** **0 violations** in `src/features` and `src/components`.

Mock imports confined to:

- `src/services/mock/**`
- `src/data-provider/MockDataProvider.ts`
- `src/tests/**`
- `src/utils/collector-management-list.ts` (imports factory — acceptable provider-layer pattern)

New mock helper `src/services/mock/photo-url.resolver.ts` used only from mock services.

---

## 3. Type safety

```
npm run type-check → exit 0
```

No TypeScript errors after follow-up changes (RBAC gates, DocumentUpload, DTO photoUrl fields).

---

## 4. Build safety

```
npm run build → exit 0
```

Production build compiles all 42 app routes.

---

## 5. Follow-up deliverables completed

| Deliverable | Path |
|-------------|------|
| RBAC gap closure | `P13-rbac-gap-closure.md` |
| Upload completion | `P13-upload-completion.md` |
| Photo render audit | `P13-photo-render-audit.md` |
| E2E execution | `P13-e2e-execution.md` |
| Runtime audit | `P13-runtime-audit.md` |
| Production readiness v2 | `P13-production-readiness-v2.md` |
| This report | `P13-final-health-report.md` |

---

## 6. Open items (verified)

| Item | Category |
|------|----------|
| E2E login bootstrap failure | Environment — port 3001 / server reuse |
| Backend API not implemented | Production blocker |
| Some avatar surfaces still Dicebear-only | Photo URL prop not passed in all UI |
| Signature upload via IUploadService | Out of scope for attachment/receipt follow-up |

---

## 7. P14 production gate preview

| Gate | Status |
|------|--------|
| type-check | **passed** |
| lint | **passed** |
| build | **passed** |
| test | **passed** |
| test:e2e | **failed** (blocked) |

**Verdict:** Frontend codebase health is **good** for demo and backend handoff. Full production gate **not met** due to E2E environment failure and backend dependencies.
