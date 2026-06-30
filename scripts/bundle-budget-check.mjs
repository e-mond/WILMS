/**
 * P14.6 — Enforce JS/CSS gzip bundle budgets from Next.js build output.
 * Run after: npm run build
 */
import { createGzip } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextStatic = path.join(root, 'apps/frontend/.next/static');

const JS_GZIP_BUDGET_BYTES = 350 * 1024;
const CSS_GZIP_BUDGET_BYTES = 100 * 1024;
const CHUNK_GZIP_WARN_BYTES = 200 * 1024;

/** Shared + entry chunks only (excludes per-route lazy chunks). */
const FIRST_LOAD_CHUNK_PATTERN =
  /^(main-app-|webpack-|framework|polyfills-|1dd3208c-|1528-)/;

function gzipSize(buffer) {
  return new Promise((resolve, reject) => {
    const gzip = createGzip();
    const chunks = [];
    gzip.on('data', (c) => chunks.push(c));
    gzip.on('error', reject);
    gzip.on('end', () => resolve(Buffer.concat(chunks).length));
    gzip.end(buffer);
  });
}

function walk(dir, ext, files = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    return files;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, ext, files);
    } else if (entry.name.endsWith(ext)) {
      files.push(full);
    }
  }

  return files;
}

async function main() {
  const jsFiles = walk(path.join(nextStatic, 'chunks'), '.js').filter((file) =>
    FIRST_LOAD_CHUNK_PATTERN.test(path.basename(file)),
  );
  const cssFiles = walk(path.join(nextStatic, 'css'), '.css');

  if (jsFiles.length === 0) {
    console.error('No JS chunks found — run npm run build first.');
    process.exit(1);
  }

  let totalJsGzip = 0;
  let totalCssGzip = 0;
  const largeChunks = [];

  for (const file of jsFiles) {
    const gz = await gzipSize(readFileSync(file));
    totalJsGzip += gz;
    if (gz > CHUNK_GZIP_WARN_BYTES) {
      largeChunks.push({ file: path.relative(root, file), gz });
    }
  }

  for (const file of cssFiles) {
    totalCssGzip += await gzipSize(readFileSync(file));
  }

  console.log(`JS total (gzip): ${(totalJsGzip / 1024).toFixed(1)} KB (budget ${JS_GZIP_BUDGET_BYTES / 1024} KB)`);
  console.log(`CSS total (gzip): ${(totalCssGzip / 1024).toFixed(1)} KB (budget ${CSS_GZIP_BUDGET_BYTES / 1024} KB)`);

  if (largeChunks.length > 0) {
    console.log('Chunks > 200KB gzip:');
    for (const chunk of largeChunks.sort((a, b) => b.gz - a.gz).slice(0, 10)) {
      console.log(`  ${chunk.file}: ${(chunk.gz / 1024).toFixed(1)} KB`);
    }
  }

  let failed = false;

  if (totalJsGzip > JS_GZIP_BUDGET_BYTES) {
    console.error(`FAIL: JS gzip ${totalJsGzip} exceeds budget ${JS_GZIP_BUDGET_BYTES}`);
    failed = true;
  }

  if (totalCssGzip > CSS_GZIP_BUDGET_BYTES) {
    console.error(`FAIL: CSS gzip ${totalCssGzip} exceeds budget ${CSS_GZIP_BUDGET_BYTES}`);
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }

  console.log('PASS: bundle budgets');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
