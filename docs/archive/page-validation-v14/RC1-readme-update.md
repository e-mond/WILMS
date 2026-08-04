# RC1 README Update Notes

**Date:** 2026-07-01

## Changes applied to README.md

1. Migration count updated to **10/10** (0000–0009 including settings extensions)
2. CI uses Node.js 22
3. Production URLs confirmed: wilms.vercel.app + wilms-production.up.railway.app
4. Added reference to RC1 audit documentation set

## Verification commands (unchanged, validated)

```bash
npm run verify:api-integrity   # 112/112 PASS
npm run type-check
npm run lint
npm run build
npm run test -w @wilms/api     # 16/16
npm run test -w @wilms/frontend # 206/206
npm audit --audit-level=critical # 0 critical
```

## Verdict

README reflects current production deployment and RC1 verification state.
