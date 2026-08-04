import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(configDir, '../..');
if (existsSync(path.join(monorepoRoot, '.env'))) {
  config({ path: path.join(monorepoRoot, '.env') });
}

export default defineConfig({  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
