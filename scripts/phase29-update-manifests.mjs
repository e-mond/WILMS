#!/usr/bin/env node
/**
 * Phase 29 — generate machine-readable manifests from latest verify-all evidence.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'docs/certification/v1.4/phase-29/evidence');
const outDir = path.join(root, 'docs/certification/v1.4/phase-29');
mkdirSync(evidenceDir, { recursive: true });

const files = readdirSync(evidenceDir)
  .filter((f) => f.startsWith('verify-all-') && f.endsWith('.json'))
  .sort()
  .reverse();

const latest = files[0] ? JSON.parse(readFileSync(path.join(evidenceDir, files[0]), 'utf8')) : null;

writeFileSync(
  path.join(outDir, 'test-evidence-manifest.json'),
  JSON.stringify(
    {
      version: '1.4.2',
      generatedAt: new Date().toISOString(),
      source: files[0] ?? null,
      latestRun: latest,
    },
    null,
    2,
  ),
);

console.log('Updated test-evidence-manifest.json');
