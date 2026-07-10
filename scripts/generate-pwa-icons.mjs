#!/usr/bin/env node
/**
 * Generates WILMS PWA icons — green & yellow brand, standard + maskable + Apple touch.
 * Requires: sharp (devDependency).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'apps/frontend/public');
const iconsDir = path.join(publicDir, 'icons');

const BRAND_GREEN = '#0f6e56';
const BRAND_GREEN_DARK = '#0a5240';
const BRAND_YELLOW = '#e8b923';
const BRAND_CREAM = '#f8f6ef';

function buildIconSvg({ background, foreground, accent, variant = 'standard' }) {
  const isMaskable = variant === 'maskable';
  const radius = isMaskable ? 0 : 96;
  const markScale = isMaskable ? 0.72 : 1;
  const cx = 256;
  const cy = 256;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${background}"/>
  <circle cx="${cx}" cy="${cy}" r="${180 * markScale}" fill="${accent}" opacity="0.22"/>
  <path d="M ${cx - 90 * markScale} ${cy + 40 * markScale}
           Q ${cx - 20 * markScale} ${cy - 120 * markScale} ${cx} ${cy - 70 * markScale}
           Q ${cx + 20 * markScale} ${cy - 120 * markScale} ${cx + 90 * markScale} ${cy + 40 * markScale}
           Q ${cx} ${cy + 110 * markScale} ${cx - 90 * markScale} ${cy + 40 * markScale} Z"
        fill="${accent}"/>
  <text x="${cx}" y="${cy + 58 * markScale}" font-family="Georgia, 'Times New Roman', serif"
        font-size="${148 * markScale}" font-weight="700" fill="${foreground}" text-anchor="middle">W</text>
</svg>`;
}

const variants = [
  {
    name: 'icon-192',
    size: 192,
    svg: buildIconSvg({
      background: BRAND_GREEN,
      foreground: BRAND_CREAM,
      accent: BRAND_YELLOW,
      variant: 'standard',
    }),
  },
  {
    name: 'icon-512',
    size: 512,
    svg: buildIconSvg({
      background: BRAND_GREEN,
      foreground: BRAND_CREAM,
      accent: BRAND_YELLOW,
      variant: 'standard',
    }),
  },
  {
    name: 'icon-192-maskable',
    size: 192,
    svg: buildIconSvg({
      background: BRAND_GREEN_DARK,
      foreground: BRAND_YELLOW,
      accent: BRAND_CREAM,
      variant: 'maskable',
    }),
  },
  {
    name: 'icon-512-maskable',
    size: 512,
    svg: buildIconSvg({
      background: BRAND_GREEN_DARK,
      foreground: BRAND_YELLOW,
      accent: BRAND_CREAM,
      variant: 'maskable',
    }),
  },
  {
    name: 'apple-touch-icon',
    size: 180,
    svg: buildIconSvg({
      background: BRAND_GREEN,
      foreground: BRAND_CREAM,
      accent: BRAND_YELLOW,
      variant: 'standard',
    }),
    outDir: publicDir,
  },
  {
    name: 'icon-192-dark',
    size: 192,
    svg: buildIconSvg({
      background: '#0b1f18',
      foreground: BRAND_YELLOW,
      accent: BRAND_GREEN,
      variant: 'standard',
    }),
  },
  {
    name: 'icon-512-dark',
    size: 512,
    svg: buildIconSvg({
      background: '#0b1f18',
      foreground: BRAND_YELLOW,
      accent: BRAND_GREEN,
      variant: 'standard',
    }),
  },
];

async function main() {
  const { default: sharp } = await import('sharp');
  await fs.mkdir(iconsDir, { recursive: true });

  for (const variant of variants) {
    const buffer = Buffer.from(variant.svg);
    const targetDir = variant.outDir ?? iconsDir;
    const ext = variant.name === 'apple-touch-icon' ? 'png' : 'png';
    const fileName = `${variant.name}.${ext}`;
    await sharp(buffer).resize(variant.size, variant.size).png().toFile(path.join(targetDir, fileName));
  }

  const faviconSvg = buildIconSvg({
    background: BRAND_GREEN,
    foreground: BRAND_CREAM,
    accent: BRAND_YELLOW,
    variant: 'standard',
  });
  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Generated WILMS PWA icons in apps/frontend/public/icons/');
}

main().catch((error) => {
  console.error('Failed to generate icons. Run: npm install sharp --save-dev');
  console.error(error);
  process.exit(1);
});
