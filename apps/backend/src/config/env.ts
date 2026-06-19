const DEFAULT_PORT = 4000;

export const env = {
  port: Number(process.env.WILMS_API_PORT ?? process.env.API_PORT ?? process.env.PORT ?? DEFAULT_PORT),
  host: process.env.WILMS_API_HOST ?? '127.0.0.1',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.WILMS_CORS_ORIGIN ?? 'http://127.0.0.1:3000',
  uploadDir: process.env.WILMS_UPLOAD_DIR ?? '.wilms-uploads',
  sessionDurationMs: 24 * 60 * 60 * 1000,
  minGroupSize: Number(process.env.WILMS_MIN_GROUP_SIZE ?? 5),
  maxGroupSize: Number(process.env.WILMS_MAX_GROUP_SIZE ?? 15),
  databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
};
