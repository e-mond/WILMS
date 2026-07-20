# Final Dead Code Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**Scope:** Light hygiene review tied to hardening; not a full knip/ts-prune purge

---

## Findings relevant to this audit

| Item | Classification | Notes |
|------|----------------|-------|
| Unwired `notify*` templates | Dead / dormant paths | Residual — listed in security pack; no runtime guarantee messages fire |
| `LOAN_CREATE` idempotency unused | Dead capability surface | Key infrastructure present; call sites not wired |
| Demo user seed helpers | Active in non-prod only | Gated by `shouldSeedDemoUsers()` — **Verified** |
| In-memory store paths | Dev/test only | Not dead; dual-mode architecture |

---

## Not claimed removed

This branch **did not** perform a repository-wide dead-code deletion. Unused templates and unused idempotency scopes remain as **known residuals**, not as silent production features.

---

## Recommendations (non-blocking for controlled rollout)

1. Inventory `notify*` helpers vs communication scheduler call sites; delete or wire.  
2. Either wire `LOAN_CREATE` idempotency on create endpoints or document as deferred with feature flag.  
3. Run `knip` / unused-export scan in a dedicated hygiene PR (separate from money hardening).

---

## Related

- [FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md) SEC-R09, SEC-R11  
- [FINAL_CODE_AUDIT.md](./FINAL_CODE_AUDIT.md)
