# Dependency Security Report — Phase 27

## Command

`npm audit --omit=dev`

## Result (this environment)

```
10 vulnerabilities (1 low, 4 moderate, 5 high)
0 critical
```

## Policy

- Did **not** run `npm audit fix --force`
- Breaking upgrades (Next 16, drizzle major, exceljs downgrade) deferred pending regression plan

## Residual risk

Accepted for controlled rollout with operator triage before broad exposure. Track Next/postcss, playwright, uuid/exceljs, drizzle advisories on the release commit.
