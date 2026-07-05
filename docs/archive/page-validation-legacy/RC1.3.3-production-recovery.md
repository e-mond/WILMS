# RC1.3.3 ÔÇö Production Recovery

| Step | Action | Status |
|------|--------|--------|
| 1 | Merge `release/rc1-3-final-certification` ÔåÆ `main` | Done (RC1.3.3) |
| 2 | Schema health + empty-db verification tooling | Done |
| 3 | Repository null-safe mappers | Done |
| 4 | Redeploy Railway from `main` HEAD | **Ops pending** |
| 5 | Redeploy Vercel from same SHA | **Ops pending** |
| 6 | `npm run smoke:production` ÔåÆ 29/29 | **Pending redeploy** |
| 7 | `npm run smoke:rbac` ÔåÆ 11/11 | **Pending redeploy** |

**No demo financial data reseeded.**
