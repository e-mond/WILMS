import { describe, expect, it } from 'vitest';
import { buildRegistrationAgreementPrintHtml } from '@/features/export/builders/registration-agreement-print-html';
import { buildRegistrationAgreementExportDocument } from '@/features/export/builders/registration-agreement-document';
import { buildBrandedExportFilename } from '@/features/export/utils/formatters';
import { WILMS_BRAND_LOGO_PATH } from '@/features/export/constants/branding';
import {
  buildRegistrationAgreementContent,
  resolveReadableRegistrationReference,
} from '@/utils/registration-agreement-fields';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import { MOCK_REGISTRATION_LEGAL_CONFIG } from '@/mocks/registration-legal';

const legal: RegistrationLegalConfig = {
  ...MOCK_REGISTRATION_LEGAL_CONFIG,
};

function createValues(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Gloria Serwaa',
    dateOfBirth: '1990-01-15',
    gender: BORROWER_GENDER.FEMALE,
    phone: '+233551112233',
    email: '',
    nationality: 'Ghanaian',
    idType: BORROWER_ID_TYPE.VOTER_ID,
    idNumber: 'A01010',
    houseAddress:
      'House 12, Airport Ridge, Sekondi-Takoradi with a very long address line that must wrap cleanly without clipping',
    gpsAddress: 'WS-123-4567',
    city: 'Fijai',
    region: 'Western',
    district: 'Sekondi Takoradi Metro',
    subDistrictUnit: 'Sekondi',
    electoralArea: 'Fijai Electoral Area',
    businessName: 'Gloria Provisions',
    businessAddress: 'Market Stall 4',
    typeOfWork: 'Trader',
    guarantorName: 'Kojo Mensah',
    guarantorPhone: '+233241234567',
    guarantorRelationship: 'Spouse',
    guarantorIdType: BORROWER_ID_TYPE.GHANA_CARD,
    guarantorIdNumber: 'GHA-123456789-0',
    guarantorPhoto: null,
    photo: null,
    ...overrides,
  } as import('@/types/borrower-registration').BorrowerRegistrationFormValues;
}

const media = {
  borrowerPhotoUrl: 'data:image/jpeg;base64,/9j/4AAQ',
  guarantorPhotoUrl: 'data:image/jpeg;base64,/9j/4AAQ',
};

describe('registration agreement print/PDF document', () => {
  it('renders an isolated light A4 loan application document with brand logo', () => {
    const content = buildRegistrationAgreementContent(
      createValues(),
      legal,
      'Registration Officer',
      media,
      {
        registrationReference: 'BRW-2026-00417',
        applicationStatus: 'PENDING',
        hasIdDocument: true,
        officerId: 'OFF-014',
        logoDataUrl: 'data:image/png;base64,logo',
      },
    );

    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('color-scheme: light');
    expect(html).toContain('background: #ffffff');
    expect(html).toContain('LOAN APPLICATION &amp; AGREEMENT FORM');
    expect(html).toContain("WOMEN'S INTEREST-FREE LOAN PROGRAMME");
    expect(html).toContain('Applicant Passport Photograph');
    expect(html).toContain('Applicant Information');
    expect(html).toContain('Work / Business Information');
    expect(html).toContain('Guarantor Declaration');
    expect(html).toContain('Borrower Declaration');
    expect(html).toContain('Key Terms &amp; Enforcement');
    expect(html).toContain('Legal Notice');
    expect(html).toContain('Officer Verification');
    expect(html).toContain('BRW-2026-00417');
    expect(html).toContain('OFF-014');
    expect(html).toContain('data:image/png;base64,logo');
    expect(html).toContain('Guarantor Signature / Thumbprint:');
    expect(html).toContain('Applicant Signature / Thumbprint:');
    expect(html).not.toContain('bg-background');
    expect(html).not.toContain('var(--color-background)');
    expect(html).not.toContain('019ffb06-c166-7130-82e6-270cfbfcb5ce');
  });

  it('falls back to the public brand logo path when no data URL is provided', () => {
    const content = buildRegistrationAgreementContent(
      createValues(),
      legal,
      'Registration Officer',
      { borrowerPhotoUrl: null, guarantorPhotoUrl: null },
    );
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain(WILMS_BRAND_LOGO_PATH);
    expect(html).toContain('Photograph not available');
  });

  it('wraps long addresses and keeps readable field values', () => {
    const content = buildRegistrationAgreementContent(
      createValues({
        fullName: 'Akosua Serwaa Amponsah-Mensah-Boateng',
      }),
      legal,
      'Registration Officer',
      media,
    );
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('overflow-wrap: anywhere');
    expect(html).toContain('word-break: break-word');
    expect(html).toContain('House 12, Airport Ridge');
    expect(html).toContain('Akosua Serwaa Amponsah-Mensah-Boateng');
    expect(html).toContain('Female');
    expect(html).toContain('Voter ID');
  });

  it('never treats raw UUIDs as registration references', () => {
    expect(
      resolveReadableRegistrationReference('019ffb06-c166-7130-82e6-270cfbfcb5ce'),
    ).toBeNull();
    expect(resolveReadableRegistrationReference('BRW-2026-00417')).toBe('BRW-2026-00417');
  });

  it('builds branded registration filenames with readable IDs', () => {
    expect(
      buildBrandedExportFilename(
        ['Borrower_Registration', 'Grace Botchway', 'BRW-2026-00417'],
        'pdf',
      ),
    ).toBe('WILMS_Borrower_Registration_Grace_Botchway_BRW-2026-00417.pdf');
  });

  it('includes registration metadata in the shared export document', () => {
    const document = buildRegistrationAgreementExportDocument({
      values: createValues(),
      legal,
      officerName: 'Ama Officer',
      agreementMedia: media,
      generatedBy: 'Ama Officer',
      meta: {
        registrationReference: 'BRW-2026-00417',
        applicationStatus: 'PENDING',
        hasIdDocument: true,
        officerId: 'OFF-014',
      },
    });

    expect(document.registrationAgreement?.registrationReference).toBe('BRW-2026-00417');
    expect(document.registrationAgreement?.documentTitle).toBe('LOAN APPLICATION & AGREEMENT FORM');
    expect(document.registrationAgreement?.officerId).toBe('OFF-014');
    expect(document.metadata.entityRef).toBe('BRW-2026-00417');
    expect(document.sections.some((section) => section.title === 'Legal Notice')).toBe(true);
    expect(document.sections.some((section) => section.title === 'Work / Business Information')).toBe(
      true,
    );
  });

  it('uses page-break avoidance rules for field rows and declarations', () => {
    const content = buildRegistrationAgreementContent(
      createValues(),
      legal,
      'Registration Officer',
      media,
    );
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('page-break-inside: avoid');
    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('page-break-after: avoid');
    expect(html).toContain('field-row');
  });

  it('renders long and short applications without inventing missing values', () => {
    const shortHtml = buildRegistrationAgreementPrintHtml(
      buildRegistrationAgreementContent(
        createValues({
          email: '',
          businessName: '',
          businessAddress: '',
          typeOfWork: '',
        }),
        legal,
        'Officer',
        { borrowerPhotoUrl: null, guarantorPhotoUrl: null },
      ),
    );

    const longHtml = buildRegistrationAgreementPrintHtml(
      buildRegistrationAgreementContent(
        createValues({
          houseAddress: `${'Long address segment, '.repeat(12)}End.`,
          businessName: 'Very Long Business Trading Enterprise Name International Limited',
        }),
        legal,
        'Officer',
        media,
        { registrationReference: 'BRW-2026-00417' },
      ),
    );

    expect(shortHtml).toContain('Not provided');
    expect(shortHtml).toContain('Photograph not available');
    expect(longHtml).toContain('Very Long Business Trading Enterprise Name International Limited');
    expect(longHtml).toContain('Long address segment');
  });
});
