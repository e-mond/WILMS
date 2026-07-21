# Accessibility Certification

**Version:** 1.4.2 | **Date:** 2026-07-21

## Code-Level Verification

- Form labels present on auth and settings forms
- Dialog components use semantic roles (Radix/shadcn patterns)
- `prefers-reduced-motion` media queries present in global styles
- Error messages surfaced as user-readable text (not raw codes)

## Automated Checks

`@axe-core/playwright` available in devDependencies. **Not executed** in this environment (no browser infrastructure).

## Manual WCAG 2.2 AA Testing

**BLOCKED** — requires running browser + screen reader (NVDA/VoiceOver).

Operator checklist: keyboard nav, focus trap in dialogs, contrast, 200% zoom, touch targets.

## Status

Code patterns **ACCEPTABLE** | Full WCAG certification **BLOCKED**
