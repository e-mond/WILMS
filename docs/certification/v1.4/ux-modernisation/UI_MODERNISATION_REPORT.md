# UI Modernisation Report

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Before → After (chrome)

| Surface | Before | After |
|---------|--------|-------|
| App navbar | `h-14` 3-column grid, sparse | `h-12` flex, max-width, clustered actions |
| Breadcrumbs | Slash separators, no collapse | Chevrons, `aria-current`, narrow ellipsis |
| Sidebar nav | Flat list | Group labels with progressive disclosure |
| Global search trigger | Boxy control | Compact command field with shortcut |
| Search results | Flat list | Grouped by entity; skeletons; safer subtitles |
| Help | FAB only | FAB + header help share `isHelpMenuOpen` |
| Skeletons | `animate-pulse` only | Shared shimmer utility |

## Visual direction

Retain WILMS executive identity (brand teal, restrained borders, calm density). No purple-on-white theme reset. No card-heavy hero marketing layouts inside the operations shell.
