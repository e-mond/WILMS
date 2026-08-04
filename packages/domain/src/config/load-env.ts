import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isServerlessRuntime } from './runtime.js';

function resolveRoots(): { domainRoot: string; monorepoRoot: string; legacyBackendRoot: string } | null {
  try {
    const configDir = path.dirname(fileURLToPath(import.meta.url));
    const domainRoot = path.resolve(configDir, '../..');
    const monorepoRoot = path.resolve(domainRoot, '../..');
    const legacyBackendRoot = path.join(monorepoRoot, 'apps', 'backend');
    return { domainRoot, monorepoRoot, legacyBackendRoot };
  } catch {
    return null;
  }
}

function loadIfExists(filePath: string): void {
  if (existsSync(filePath)) {
    config({ path: filePath });
  }
}

/**
 * Loads environment files without overriding variables already set in the process
 * (e.g. CI, production platform secrets).
 *
 * On Vercel/serverless, skip dotenv file probing — secrets come from the platform,
 * and `import.meta.url` path resolution is unreliable inside webpack bundles.
 *
 * Precedence (later files only fill unset keys — dotenv default):
 * 1. monorepo `.env`
 * 2. `packages/domain/.env` (+ production variants)
 * 3. legacy `apps/backend/.env.local` (dual-run local overrides)
 */
export function loadEnvironment(): void {
  if (isServerlessRuntime() || process.env.VERCEL === '1') {
    return;
  }

  const roots = resolveRoots();
  if (!roots) {
    return;
  }

  const { domainRoot, monorepoRoot, legacyBackendRoot } = roots;
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  loadIfExists(path.join(monorepoRoot, '.env'));

  if (nodeEnv === 'production') {
    loadIfExists(path.join(domainRoot, '.env.production'));
    loadIfExists(path.join(legacyBackendRoot, '.env.production'));
    loadIfExists(path.join(monorepoRoot, '.env.production'));
  } else {
    loadIfExists(path.join(domainRoot, '.env'));
    loadIfExists(path.join(domainRoot, '.env.local'));
    loadIfExists(path.join(legacyBackendRoot, '.env'));
    loadIfExists(path.join(legacyBackendRoot, '.env.local'));
    loadIfExists(path.join(monorepoRoot, '.env.local'));
  }
}

loadEnvironment();
