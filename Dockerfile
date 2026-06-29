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

ENV NODE_ENV=production

CMD ["npm", "run", "start:prod", "-w", "@wilms/api"]
