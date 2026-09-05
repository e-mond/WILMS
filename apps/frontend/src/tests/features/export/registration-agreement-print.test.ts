import { describe, expect, it } from 'vitest';
import { buildRegistrationAgreementPrintHtml } from '@/features/export/builders/registration-agreement-print-html';
import { buildRegistrationAgreementExportDocument } from '@/features/export/builders/registration-agreement-document';
import { buildBrandedExportFilename } from '@/features/export/utils/formatters';
import {
  buildRegistrationAgreementContent,
  resolveReadableRegistrationReference,
} from '@/utils/registration-agreement-fields';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';

const legal: RegistrationLegalConfig = {
  programName: "Women's Interest-Free Loan Programme",
  formTitle: 'Borrower Registration Form',
  instructionText: 'Complete all fields accurately.',
  programDeclaration: 'Interest-free programme declaration.',
  guarantorDeclaration: 'I agree to guarantee this loan.',
  borrowerDeclaration: 'I agree to the programme terms.',
  keyTerms: 'Repayments are interest-free.',
  legalNotice: 'Official WILMS record.',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createValues() {
  return {
    fullName: 'Gloria Serwaa',
    dateOfBirth: '1990-01-15',
    gender: BORROWER_GENDER.FEMALE,
    phone: '+233551112233',
    email: '',
    nationality: 'Ghanaian',
    idType: BORROWER_ID_TYPE.VOTER_ID,
    idNumber: 'A01010',
    houseAddress: 'House 12, Airport Ridge, Sekondi-Takoradi with a very long address line that must wrap',
    gpsAddress: 'WS-123-4567',
    city: 'Fijai',
    region: 'Western',
    district: 'Sekondi Takoradi Metro',
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
  } as import('@/types/borrower-registration').BorrowerRegistrationFormValues;
}

const media = {
  borrowerPhotoUrl: 'data:image/jpeg;base64,/9j/4AAQ',
  guarantorPhotoUrl: 'data:image/jpeg;base64,/9j/4AAQ',
};

describe('registration agreement print/PDF document', () => {
  it('forces an isolated light A4 document (not app dark theme)', () => {
    const content = buildRegistrationAgreementContent(
      createValues(),
      legal,
      'Registration Officer',
      media,
      {
        registrationReference: 'BRW-2026-00417',
        applicationStatus: 'PENDING',
        hasIdDocument: true,
      },
    );

    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('color-scheme: light');
    expect(html).toContain('background: #ffffff');
    expect(html).toContain('background: var(--doc-bg) !important');
    expect(html).toContain('counter(page)');
    expect(html).toContain('Borrower Registration Review');
    expect(html).toContain('BRW-2026-00417');
    expect(html).toContain('Applicant passport photo');
    expect(html).toContain('Application Information');
    expect(html).toContain('Documents');
    expect(html).not.toContain('bg-background');
    expect(html).not.toContain('var(--color-background)');
    expect(html).not.toContain('019ffb06-c166-7130-82e6-270cfbfcb5ce');
  });

  it('wraps long addresses and keeps readable field values', () => {
    const content = buildRegistrationAgreementContent(
      createValues(),
      legal,
      'Registration Officer',
      media,
    );
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('overflow-wrap: anywhere');
    expect(html).toContain('word-break: break-word');
    expect(html).toContain('House 12, Airport Ridge');
    expect(html).toContain('Gloria Serwaa');
  });

  it('never treats raw UUIDs as registration references', () => {
    expect(
      resolveReadableRegistrationReference('019ffb06-c166-7130-82e6-270cfbfcb5ce'),
    ).toBeNull();
    expect(resolveReadableRegistrationReference('BRW-2026-00417')).toBe('BRW-2026-00417');
  });

  it('builds branded registration review filenames with readable IDs', () => {
    expect(
      buildBrandedExportFilename(
        ['Borrower_Registration_Review', 'Gloria Serwaa', 'BRW-2026-00417'],
        'pdf',
      ),
    ).toBe('WILMS_Borrower_Registration_Review_Gloria_Serwaa_BRW-2026-00417.pdf');
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
      },
    });

    expect(document.registrationAgreement?.registrationReference).toBe('BRW-2026-00417');
    expect(document.registrationAgreement?.documentTitle).toBe('Borrower Registration Review');
    expect(document.metadata.entityRef).toBe('BRW-2026-00417');
    expect(document.sections.some((section) => section.title === 'Documents')).toBe(true);
    expect(document.sections.some((section) => section.title === 'Application Information')).toBe(
      true,
    );
  });

  it('uses page-break avoidance rules for sections and field rows', () => {
    const content = buildRegistrationAgreementContent(
      createValues(),
      legal,
      'Registration Officer',
      media,
    );
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('page-break-inside: avoid');
    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('field-row');
  });
});
