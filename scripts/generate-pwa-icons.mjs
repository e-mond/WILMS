#!/usr/bin/env node
/**
 * Generates WILMS PWA icons (192, 512) and favicon from brand SVG.
 * Requires: npm install sharp (devDependency) or npx sharp available.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'apps/frontend/public');
const iconsDir = path.join(publicDir, 'icons');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f6e56"/>
  <text x="256" y="310" font-family="Georgia, serif" font-size="220" font-weight="700" fill="#f1efe8" text-anchor="middle">W</text>
</svg>`;

async function main() {
  const { default: sharp } = await import('sharp');
  await fs.mkdir(iconsDir, { recursive: true });

  const buffer = Buffer.from(svg);

  await sharp(buffer).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(buffer).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(buffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Generated PWA icons in apps/frontend/public/icons/');
}

main().catch((error) => {
  console.error('Failed to generate icons. Run: npm install sharp --save-dev');
  console.error(error);
  process.exit(1);
});
