# Accessibility Report — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Standard target:** WCAG 2.1 AA (project DoD)  
**Full automated a11y sweep this pack:** **Not re-run** — no fabricated axe/Lighthouse scores

---

## Phase 26 impact

| Change | A11y relevance |
|--------|----------------|
| Password min 10 + complexity messages | Ensure errors are associated with fields (existing form patterns) |
| Invitation expired messaging | Auth error text must remain visible to SR users (existing alert patterns) |
| SoD validation messages | Surface via existing toast/inline error paths — no new modal patterns |

Shell/chrome a11y work from UX modernisation and PR #136 (focus, sidebar expand) remains the baseline.

---

## Carry-forward expectations

| Area | Status |
|------|--------|
| Role-restricted UI removed (not CSS-hidden) | Design rule — ADR-002 |
| Keyboard nav for command palette / help | Present from shell hardening |
| Focus management on login | Improved in PR #136 — not remeasured here |
| Currency via `<CurrencyAmount />` | Unchanged |

---

## Residuals / operator

| ID | Item | Action |
|----|------|--------|
| P26-A11Y-01 | Post-deploy keyboard QA (Collector + Approver) | Operator / QA |
| P26-A11Y-02 | Automated axe/Playwright a11y suite on release URL | Staging — not evidenced here |
| P26-A11Y-03 | Contrast checks on any env-specific theming | Operator if custom CSS |

---

## Explicit non-claims

- No claim of full WCAG AA conformance certificate.  
- No invented automated scan percentages.

**Verdict context:** READY WITH CONDITIONS — Production Certified **NOT ISSUED**.
