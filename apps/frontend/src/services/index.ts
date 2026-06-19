/**
 * Service layer entry — webpack resolves to index.development.ts in dev
 * and index.production.ts in production builds (see next.config.mjs).
 */
export * from '@/services/index.production';
