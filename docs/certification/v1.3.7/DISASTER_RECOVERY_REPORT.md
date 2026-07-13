# Disaster Recovery Report — v1.3.7

**Date:** 2026-07-13  
**Verdict:** **NOT VALIDATED** — simulation not executed

---

## Architecture

```
Users → Vercel (frontend/BFF) → Railway (API) → Neon PostgreSQL
                              ↘ Cloudinary (uploads)
```

---

## Planned DR scenarios

| Scenario | Planned response | Executed |
|----------|------------------|----------|
| Database failure | Neon PITR restore to branch; swap `DATABASE_URL` | **NO** |
| API crash / Railway outage | Railway rollback to prior deployment | **NO** |
| Frontend outage | Vercel promote previous deployment | **NO** |
| Cloudinary outage | Read-only mode for uploads; in-app degraded | **NO** |
| Full region loss | Restore Neon branch + redeploy Railway/Vercel | **NO** |

---

## RPO / RTO (documented targets — not measured)

| Metric | Target | Measured RPO | Measured RTO |
|--------|--------|--------------|--------------|
| **RPO** (data loss window) | ≤ 1 h (Neon PITR) | **NOT MEASURED** | — |
| **RTO** (recovery time) | ≤ 4 h (rollback + DB restore) | — | **NOT MEASURED** |

Actual RPO/RTO depend on Neon plan retention and operator response time. **No live drill was performed.**

---

## Recovery runbook references

- [production-runbook.md](../../operations/production-runbook.md) — rollback steps
- [backups.md](../../operations/backups.md) — Neon PITR
- [deployment-guide.md](../../deployment-guide.md) — platform deploy

---

## Application restart evidence

Production API was observed running (uptime ~1068s at first probe, `deployedAt: 2026-07-13T15:39:25Z`). This confirms deploy succeeded but **does not validate** recovery from failure.

---

## Verdict

Disaster recovery procedures are documented but **not validated**. Schedule a controlled DR drill on staging before public go-live.
