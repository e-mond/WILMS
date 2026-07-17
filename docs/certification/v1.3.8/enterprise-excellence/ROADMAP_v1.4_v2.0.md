# Roadmap v1.4 → v2.0 (Phase 18 alignment)

Supersedes nothing in Phase 17; **extends** with excellence findings.

## v1.4 — Hardening & scale foundations

- Mandatory Idempotency-Key on money POSTs
- Cursor pagination on borrowers/payments/groups/expenses
- Durable Redis/BullMQ workers + DLQ
- SQL borrower segments + expense date aggregates
- Split settings service
- OpenTelemetry + alerts
- Node 22 everywhere
- Quarterly restore drill automation
- Offline queue → IndexedDB
- OpenAPI generation
- knip/madge CI gates

## v1.5 — Accounting & policy

- GL dual-write + trial balance MVP
- Balance drift monitors
- Tamper-evident audit hash chain
- ABAC/policy module
- Period close + audit export pack
- Field-level encryption for national ID/phone (if required)

## v2.0 — Platform maturity

- GL authoritative for cash/P&L
- Multi-branch / regional org model
- Analytics / forecasting / risk scoring (product)
- Fraud detection heuristics on recon + GPS anomalies
- Compliance reporting packs for NGO/bank/gov partners
- Optional service extract for Communications/Reporting only if scale demands

## Future enterprise features (candidates)

| Audience | Feature |
|---|---|
| Banks / regulators | Statutory GL, period lock, signed exports |
| Government / NGO | Multi-funder pools, grant reporting |
| Multi-branch | Org units, regional admins, SoD by branch |
| Field ops | Strong offline-first, device attestation |
| Analytics | Portfolio forecasting, cohort default risk |
| AI assist | Draft messages, anomaly explanations (human-approved) — never auto-post money |
