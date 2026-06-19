# WILMS — WCAG 2.1 AA Accessibility Audit
> QA-03 | Last run: 2026-06-08

---

## Scope

Automated axe-core scans (Playwright) on representative routes per role shell:

| Route | Shell | Spec |
|---|---|---|
| `/login` | Auth (unauthenticated) | `e2e/accessibility.spec.ts` |
| `/collector/dashboard` | Collector | `e2e/accessibility.spec.ts` |
| `/approver/pending` | Office (Approver) | `e2e/accessibility.spec.ts` |

Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

---

## Remediation Applied (QA-03)

| Issue | Fix | Files |
|---|---|---|
| No skip navigation link | `SkipToContent` → `#main-content` | `src/components/accessibility/SkipToContent.tsx`, `layout.tsx` |
| Missing `<main>` landmark on authenticated shells | `<main id="main-content" tabIndex={-1}>` in office + collector shells | `OfficeShell.tsx`, `CollectorShell.tsx` |
| Focus lost on route change | `FocusOnRouteChange` moves focus to main on navigation | `FocusOnRouteChange.tsx`, `layout.tsx` |
| Clickable table rows not keyboard-operable | `tabIndex`, Enter/Space handlers, optional `getRowAriaLabel` | `DataTable.tsx` |
| Inconsistent focus ring | Global `:focus-visible` outline using brand token | `globals.css` |
| LIVE badge contrast (executive header) | Dark text on amber background | `OfficeShellHeader.tsx` |
| Mobile collector nav active state contrast | `variant="executive"` on bottom-nav `ShellNavLink` | `CollectorShell.tsx` |
| Mobile shells missing page `<h1>` | `ShellMainLandmark` with sr-only title in `<main>` | `ShellMainLandmark.tsx` |

---

## Manual Checks (ui-context.md §7)

| Requirement | Status | Notes |
|---|---|---|
| Keyboard reachability | ✅ | DataTable rows; native controls elsewhere |
| Logical focus order | ✅ | Skip link → banner → shell nav → main |
| Visible form labels | ✅ | `FormField` pattern; login uses labelled inputs |
| Status badges not colour-only | ✅ | Text labels on all `StatusBadge` variants |
| Icon accessibility | ✅ | Decorative icons paired with text or `aria-label` |
| Contrast 4.5:1 / 3:1 large | ✅ | Design tokens in `tokens.css`; axe scan clean on scoped routes |
| Table semantics | ✅ | `caption`, `th scope="col"` on `DataTable` |
| Live regions (offline/demo) | ✅ | `role="status"` on `OfflineBanner`, `DemoModeBanner`, `PwaInstallBanner` |

---

## Known Limitations

- **Full-site axe coverage** — Only three high-traffic routes are scanned in CI; detail/form pages inherit shell fixes but are not individually scanned yet.
- **Mobile drawer** — `Drawer` traps focus when open; not covered by current axe routes (drawer closed during scan).
- **Colour contrast on executive gold** — Executive sidebar uses gold on dark; verified on scanned pages only.

---

## Re-run Instructions

```bash
npm run test:e2e -- e2e/accessibility.spec.ts
```

Violations are printed as JSON in the Playwright assertion message on failure.
