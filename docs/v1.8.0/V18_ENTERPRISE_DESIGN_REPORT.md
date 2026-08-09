# WILMS v1.8.0 — Enterprise Design Report

## Typography / CSP

- Removed runtime Google Fonts `@import` from `globals.css`
- Self-host via `next/font/google` (`Source Sans 3`, `Source Serif 4`) — bundled at build, served from `/_next/static`
- CSP `font-src 'self' data:` remains; no googleapis/gstatic allowlist required
- Export print HTML uses system font stacks (no external stylesheet)

## Design direction

iOS / visionOS-inspired enterprise surfaces: soft cards, glass headers, unique icons, generous spacing — applied incrementally across role dashboards in Phase E.
