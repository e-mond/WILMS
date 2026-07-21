# Final Dependency Report

**Version:** 1.4.2 | **Phase:** 31

`npm audit --omit=dev`: **7** residual (0 critical, 4 high)

| Package | Severity | Production exploitability | Action |
|---------|----------|---------------------------|--------|
| next | High | Framework DoS/cache — track Next 14.x patches; no force to 16 | Monitor |
| drizzle-orm | High | Identifier injection — app uses parameterized queries | Accept / track |
| playwright | High | Dev/e2e only | Accept |
| postcss (via next) | Moderate | Build-time | Track with Next |
| uuid (via exceljs) | Moderate | Export path | Monitor |

Did **not** run `npm audit fix --force`.
