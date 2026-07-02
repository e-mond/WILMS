const DEFAULT_PORT = 4000;

const nodeEnv = process.env.NODE_ENV ?? 'development';

function resolveSessionSecret(): string {
  const secret = process.env.WILMS_SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (nodeEnv === 'production') {
    throw new Error('WILMS_SESSION_SECRET is required in production.');
  }

  return 'wilms-dev-session-secret-change-me';
}

function resolveTrustProxy(): boolean {
  const raw = process.env.WILMS_TRUST_PROXY?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') {
    return true;
  }
  if (raw === 'false' || raw === '0') {
    return false;
  }
  return nodeEnv === 'production';
}

export const env = {
  port: Number(process.env.WILMS_API_PORT ?? process.env.API_PORT ?? process.env.PORT ?? DEFAULT_PORT),
  host: process.env.WILMS_API_HOST ?? (nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1'),
  nodeEnv,
  corsOrigin: process.env.WILMS_CORS_ORIGIN ?? 'http://127.0.0.1:3000',
  uploadDir: process.env.WILMS_UPLOAD_DIR ?? '.wilms-uploads',
  sessionDurationMs: 24 * 60 * 60 * 1000,
  sessionSecret: resolveSessionSecret(),
  minGroupSize: Number(process.env.WILMS_MIN_GROUP_SIZE ?? 5),
  maxGroupSize: Number(process.env.WILMS_MAX_GROUP_SIZE ?? 15),
  databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
  trustProxy: resolveTrustProxy(),
  trustProxyHops: Number(process.env.WILMS_TRUST_PROXY_HOPS ?? 1),
  gitCommit:
    process.env.WILMS_GIT_COMMIT?.trim() ||
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    undefined,
};
