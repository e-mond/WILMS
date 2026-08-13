/**
 * Sync documentation library into the frontend public tree so the in-app
 * Documentation Centre can download PDF/DOCX and fetch Markdown without GitHub.
 * Run: node scripts/sync-documentation-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'documentation');
const destRoot = path.join(root, 'apps', 'frontend', 'public', 'documentation');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else if (/\.(md|pdf|docx)$/i.test(entry.name)) {
      fs.copyFileSync(src, dest);
    }
  }
}

if (!fs.existsSync(srcRoot)) {
  console.error('Missing documentation/ library');
  process.exit(1);
}

fs.rmSync(destRoot, { recursive: true, force: true });
fs.mkdirSync(destRoot, { recursive: true });

for (const folder of [
  'books',
  'technical',
  'operations',
  'user-guides',
  'developer',
  'roadmap',
  'pdf',
  'docx',
  'branding',
  'web',
  'notifications',
]) {
  const from = path.join(srcRoot, folder);
  if (fs.existsSync(from)) {
    copyDir(from, path.join(destRoot, folder));
  }
}

for (const file of ['DOCUMENTATION_LIBRARY_INDEX.md', 'FINAL_DOCUMENTATION_REPORT.md']) {
  const from = path.join(srcRoot, file);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(destRoot, file));
  }
}

console.log(`Synced documentation assets → ${path.relative(root, destRoot)}`);
