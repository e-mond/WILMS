# Accessibility Report (v1.6.1)

## WCAG 2.2 AA readiness improvements

| Area | Change |
|------|--------|
| Focus | Global `:focus-visible` brand outline; control focus tokens |
| Motion | `prefers-reduced-motion` disables animations/transitions |
| Search | `listbox` / `option` / `aria-activedescendant` keyboard nav |
| Notifications | Filter `tablist`, unread stripe, sr-only bell counts |
| Progress | Collector hero + loan stepper use `role="progressbar"` |
| Tables | Captions supported; sticky headers remain in DOM order |
| Nav | Collapsible groups expose `aria-expanded` |

## Smoke checklist

- [ ] Tab through navbar → search → notifications → profile
- [ ] Open command palette with Ctrl/Cmd+K; arrow + Enter
- [ ] Collapse/expand sidebar groups with keyboard
- [ ] Notification filters operable by keyboard
- [ ] Reduced-motion OS setting removes card lift / shimmer

## Residual risk

Third-party chart canvases may need additional text alternatives in a future a11y hardening pass.
