# WILMS API production image — build context: monorepo root
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared-contracts/package.json packages/shared-contracts/
COPY packages/shared-rbac/package.json packages/shared-rbac/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-validation/package.json packages/shared-validation/

RUN npm ci --include=dev

COPY apps/backend apps/backend
COPY packages packages

# Bake the build commit only as a fallback. At runtime, env.ts prefers the
# platform-injected RAILWAY_GIT_COMMIT_SHA over WILMS_GIT_COMMIT so redeploys
# always report the live commit even if this build arg is stale.
ARG RAILWAY_GIT_COMMIT_SHA
ARG GIT_COMMIT
ENV WILMS_GIT_COMMIT=${RAILWAY_GIT_COMMIT_SHA:-${GIT_COMMIT}}

ENV NODE_ENV=production

CMD ["npm", "run", "start:prod", "-w", "@wilms/api"]
