# Neon database branches (dev vs production)

WILMS currently points local `apps/backend/.env.local` `DATABASE_URL` at Neon endpoint:

`ep-noisy-river-atkdh45c-pooler` (pooler, US East)

Migration **0040** was applied to that database on 2026-08-10. Health watermark is **ok**.

## Recommended layout

| Branch | Purpose | Who uses it |
|--------|---------|-------------|
| `production` (or Neon default/main) | Live `wilms.vercel.app` | Vercel Production `DATABASE_URL` |
| `dev` | Local + preview deploys only | Local `.env.local`, Vercel Preview |

## Create a dedicated `dev` branch (Neon Console or CLI)

### Console
1. Open the Neon project → **Branches**
2. Create branch **`dev`** from **`production` / main** (copy data optional)
3. Copy the **dev** connection string (prefer pooled for the app)
4. Put it in local `apps/backend/.env.local` as `DATABASE_URL`
5. Keep production’s connection string only in Vercel Production env

### CLI (requires `NEON_API_KEY`)
```bash
# once
export NEON_API_KEY=...   # Neon Console → Account → API keys

npx neonctl branches list --project-id <project-id>
npx neonctl branches create --project-id <project-id> --name dev --parent production
npx neonctl connection-string dev --project-id <project-id> --pooled
```

Then:
```bash
# Apply pending migrations on the NEW branch
DATABASE_URL="<dev pooled url>" npm run db:migrate -w @wilms/domain
# or
DATABASE_URL="<dev pooled url>" npx tsx packages/domain/src/verification/apply-0040-migration.ts
```

## Safety rules
- Never point local development at production unless intentionally ops-debugging.
- Run `npm run verify:migrations -w @wilms/domain` after switching `DATABASE_URL`.
- Vercel Preview should use the **dev** branch URL; Production stays on **production**.

## Status of this machine (2026-08-10)
- No `NEON_API_KEY` in env — branch create could not be automated from the agent.
- The connection string currently in `apps/backend/.env.local` already received migration **0040** (treat as the active ops DB until you split `dev`).
