# Navigation Redesign Report (v1.6.1)

## Header

- Sticky app navbar with stronger backdrop blur.
- Scroll elevation via `navbar-elevated` / `--shadow-navbar`.
- Command search trigger with ⌘K hint.
- Notification bell, help, profile actions preserved through `ShellNavbarActions`.

## Sidebar

- Role-aware grouped navigation (existing `groupShellNavItems`).
- Collapsible groups with persistence in `localStorage` (`wilms.shell.nav-groups`).
- Desktop collapse preference unchanged (`shellLayoutStore`).
- Mobile drawer continues to force expanded labels.

## Command / search

- Larger modal (`max-w-3xl`), taller result viewport.
- Recent searches persisted locally (`wilms.global-search.recent`).
- Grouped results, keyboard navigation, entity avatars retained.
- Recent chips restore the query for fuzzy/entity search.

## Docs

See also `docs/ui/NAVIGATION.md`.
