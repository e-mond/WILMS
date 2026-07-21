# Final Manual Actions Required — Phase 27

## Before Production Certified

1. **Apply migration** `0029_v141_invitation_tokens` on every environment.
2. **Resend invitations** for any users still on pre-token email links.
3. **Configure Redis** (`REDIS_URL`) for multi-instance rate limits and durable queues.
4. **Run staging smoke** (`smoke:staging`, `smoke:rbac`) with non-demo accounts — all roles.
5. **Execute backup/restore drill** on Neon (or provider) and record RTO/RPO.
6. **Purge** any live `@wilms.demo` users if present.
7. **Triage npm audit** highs without blind `--force`.
8. **Verify secrets**: `WILMS_SESSION_SECRET`, mail/SMS, Cloudinary, feature flags.
9. **Human sign-off** on residual Mediums (defaulter SQL scale, accepted CVEs).
10. Attach evidence into the Phase 27 reports and only then reconsider Production Certified.
