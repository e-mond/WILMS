# WILMS documentation hub

**Audience:** engineers, operators, security reviewers, auditors  
**Current product version:** `1.5.0`  
**Architecture:** Next.js full-stack on Vercel + Neon (+ Redis for rate limits)

This hub is the entry point for **current** documentation. Historical certification packs and phase notes live under [`archive/`](archive/README.md) and [`certification/`](certification/) and are frozen evidence—not day-to-day runbooks.

---

## Start here

| Doc | Purpose |
|---|---|
| [Root README](../README.md) | Product overview, quick start, structure |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture (verified against v1.5 code) |
| [environment.md](environment.md) | Environment variables |
| [authentication.md](authentication.md) | Sessions, cookies, middleware |
| [PERMISSIONS_AND_ROLES.md](PERMISSIONS_AND_ROLES.md) | RBAC and permission overrides |
| [FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) | Financial domain rules |
| [deployment-guide.md](deployment-guide.md) | Vercel + Neon deployment |
| [operations.md](operations.md) | Health, metrics, scheduler, incidents |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Concrete failure diagnosis |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Branching, PR, validation gates |
| [../DOCUMENTATION_REPORT.md](../DOCUMENTATION_REPORT.md) | Documentation audit trail |

---

## Release packs (current)

| Pack | Path |
|---|---|
| v1.5 platform consolidation | [`v1.5/`](v1.5/) |
| v1.4.3 financial workflow hotfix notes | [`v1.5/V1.4.3_HOTFIX_REPORT.md`](v1.5/V1.4.3_HOTFIX_REPORT.md) (archived with active cross-links) |

---

## Engineering notes

| Doc | Purpose |
|---|---|
| [architecture/](architecture/) | Progress tracker, UI context, standards |
| [adr/](adr/) | Architecture decision records |
| [engineering/](engineering/) | Feature engineering notes (e.g. communication platform) |
| [operations/](operations/) | Additional ops materials when present |

---

## Historical material

| Location | Policy |
|---|---|
| [`archive/`](archive/README.md) | Frozen. Do not “update to match production.” |
| [`certification/`](certification/) | Versioned certification evidence. Treat as immutable. |
| [`planning/`](planning/) | Roadmaps may describe **future** work—do not treat as shipped features. |

---

## Agent / environment notes

Root [`AGENTS.md`](../AGENTS.md) describes monorepo commands for automated development environments. It is operational configuration, not product marketing.
