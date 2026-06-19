# WILMS Theme Audit
> **Date:** 2026-06-10  
> **Scope:** Light/dark mode token compliance (P2)

---

## Root cause fixed

`[data-sidebar='executive']` in `tokens.css` previously forced dark palette (`#161616`, white text) **in all themes**, so the sidebar stayed dark when light mode was enabled.

`ExecutiveThemeInitializer` also forced dark mode on first executive visit, overriding user preference.

---

## Changes

| Area | Fix |
|---|---|
| Executive sidebar (light) | `--color-executive-sidebar: #f5f4f0`; standard text/border tokens |
| Executive sidebar (dark) | Scoped overrides under `.dark` / `[data-theme='dark']` only |
| Executive gold (light nav) | Uses brand primary green; gold reserved for dark executive |
| Theme initializer | No-op — user toggle is authoritative |
| Text tokens | Added `--color-text-secondary`, `--color-text-tertiary` + Tailwind aliases |

---

## Remaining audit items

- [ ] Login / lock screens — verify token-only colours
- [ ] Toast / modal / drawer surfaces in dark mode pass
- [ ] Chart components — confirm no inline hex
- [ ] Settings demo colour inputs — display tokens not hardcoded swatches in production

---

## Validation

1. Toggle light mode on Super Admin dashboard — sidebar, navbar, cards, tables use light surfaces.
2. Toggle dark mode — executive gold sidebar and content tokens apply.
3. Registration officer routes load without chunk errors after clean build.
