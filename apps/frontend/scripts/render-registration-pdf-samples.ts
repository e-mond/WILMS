/**
 * Visual QA helper: renders short + long registration agreement HTML to PDF
 * via Playwright Chromium for manual inspection.
 *
 * Usage (from apps/frontend):
 *   npx tsx --tsconfig tsconfig.json scripts/render-registration-pdf-samples.ts
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { buildRegistrationAgreementPrintHtml } from '../src/features/export/builders/registration-agreement-print-html';
import { buildRegistrationAgreementContent } from '../src/utils/registration-agreement-fields';
import { MOCK_REGISTRATION_LEGAL_CONFIG } from '../src/mocks/registration-legal';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '../src/constants/borrower-registration';
import type { BorrowerRegistrationFormValues } from '../src/types/borrower-registration';

const outDir = join(process.cwd(), 'tmp-export-qa');
mkdirSync(outDir, { recursive: true });

const logoPath = join(process.cwd(), 'public/icons/icon-192.png');
const logoDataUrl = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;

function sampleValues(kind: 'short' | 'long'): BorrowerRegistrationFormValues {
  const base = {
    fullName: kind === 'short' ? 'Ama Mensah' : 'Akosua Serwaa Amponsah-Mensah-Boateng',
    dateOfBirth: '1990-01-15',
    gender: BORROWER_GENDER.FEMALE,
    phone: '+233551112233',
    email: kind === 'short' ? '' : 'akosua.longname@example.com',
    nationality: 'Ghanaian',
    idType: BORROWER_ID_TYPE.VOTER_ID,
    idNumber: '0123456789',
    houseAddress:
      kind === 'short'
        ? 'House 4, Madina'
        : 'House 12, Airport Ridge Extension, Sekondi-Takoradi — ' +
          'a very long residential address line that must wrap cleanly across multiple lines without clipping or overflowing the printable A4 page width.',
    gpsAddress: 'WS-123-4567',
    city: 'Fijai',
    region: 'Western',
    district: 'Sekondi Takoradi Metro',
    subDistrictUnit: 'Sekondi',
    electoralArea: 'Fijai Electoral Area',
    businessName: kind === 'short' ? '' : 'Very Long Business Trading Enterprise Name International Limited',
    businessAddress: kind === 'short' ? '' : 'Market Stall 4, Takoradi Market Circle, near the main entrance gate',
    typeOfWork: kind === 'short' ? '' : 'Trader',
    guarantorName: 'Kojo Mensah',
    guarantorPhone: '+233241234567',
    guarantorRelationship: 'Spouse',
    guarantorIdType: BORROWER_ID_TYPE.GHANA_CARD,
    guarantorIdNumber: 'GHA-123456789-0',
    guarantorPhoto: null,
    photo: null,
  } as BorrowerRegistrationFormValues;

  return base;
}

async function renderSample(kind: 'short' | 'long') {
  const content = buildRegistrationAgreementContent(
    sampleValues(kind),
    MOCK_REGISTRATION_LEGAL_CONFIG,
    'Ama Officer',
    {
      borrowerPhotoUrl: kind === 'long' ? logoDataUrl : null,
      guarantorPhotoUrl: kind === 'long' ? logoDataUrl : null,
    },
    {
      registrationReference: kind === 'long' ? 'BRW-2026-00417' : null,
      applicationStatus: kind === 'long' ? 'PENDING' : 'DRAFT',
      officerId: 'OFF-014',
      logoDataUrl,
    },
  );

  const html = buildRegistrationAgreementPrintHtml(content);
  const htmlPath = join(outDir, `registration-${kind}.html`);
  const pdfPath = join(outDir, `registration-${kind}.pdf`);
  const pngPath = join(outDir, `registration-${kind}.png`);

  writeFileSync(htmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' },
  });
  await page.screenshot({ path: pngPath, fullPage: true });
  await browser.close();

  console.log(`Wrote ${htmlPath}`);
  console.log(`Wrote ${pdfPath}`);
  console.log(`Wrote ${pngPath}`);
}

await renderSample('short');
await renderSample('long');
console.log('Visual QA samples ready in', outDir);
