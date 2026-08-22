/**
 * CI migration runner — resolves DATABASE_URL then applies pending Drizzle migrations.
 *
 * Resolution order:
 * 1. DATABASE_URL env (GitHub secret)
 * 2. Neon API (NEON_API_KEY repo secret)
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function neonFetch(pathname) {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(`https://console.neon.tech/api/v2${pathname}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Neon API ${pathname} failed (${response.status}): ${body.slice(0, 240)}`);
  }

  return response.json();
}

async function resolveDatabaseUrlFromNeon() {
  const projectsPayload = await neonFetch('/projects?limit=50');
  const projects = projectsPayload?.projects ?? [];
  if (projects.length === 0) {
    throw new Error('Neon API returned no projects.');
  }

  const preferred =
    projects.find((project) => /wilms/i.test(project.name)) ??
    projects.find((project) => project.name === 'WILMS') ??
    projects[0];

  const branchesPayload = await neonFetch(`/projects/${preferred.id}/branches`);
  const branches = branchesPayload?.branches ?? [];
  const branch =
    branches.find((entry) => entry.primary) ??
    branches.find((entry) => entry.name === 'main') ??
    branches[0];

  if (!branch) {
    throw new Error(`No branches found for Neon project ${preferred.name}.`);
  }

  const params = new URLSearchParams({
    branch_id: branch.id,
    role_name: process.env.NEON_ROLE_NAME ?? 'neondb_owner',
    database_name: process.env.NEON_DATABASE_NAME ?? 'neondb',
  });

  const uriPayload = await neonFetch(
    `/projects/${preferred.id}/connection_uri?${params.toString()}`,
  );

  const connectionUri = uriPayload?.uri ?? uriPayload?.connection_uri;
  if (!connectionUri) {
    throw new Error('Neon connection_uri response did not include a URI.');
  }

  console.log(
    `Resolved DATABASE_URL from Neon project "${preferred.name}" branch "${branch.name}".`,
  );
  return connectionUri;
}

async function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    console.log('Using DATABASE_URL from environment.');
    return process.env.DATABASE_URL.trim();
  }

  if (process.env.NEON_API_KEY?.trim()) {
    return resolveDatabaseUrlFromNeon();
  }

  throw new Error(
    'DATABASE_URL is not configured. Add DATABASE_URL to the GitHub production environment, or ensure NEON_API_KEY is set so migrations can resolve the Neon connection automatically.',
  );
}

async function main() {
  const databaseUrl = await resolveDatabaseUrl();
  execSync('node scripts/apply-pending-migrations.mjs', {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
