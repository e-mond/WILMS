import { describe, expect, it } from 'vitest';
import { buildRegistrationAgreementPrintHtml } from '@/features/export/builders/registration-agreement-print-html';
import { buildRegistrationAgreementExportDocument } from '@/features/export/builders/registration-agreement-document';
import { buildBrandedExportFilename } from '@/features/export/utils/formatters';
import { WILMS_BRAND_LOGO_PATH } from '@/features/export/constants/branding';
import {
  buildRegistrationAgreementContent,
  resolveReadableRegistrationReference,
  resolveSignatureCaptureMode,
} from '@/utils/registration-agreement-fields';
import { reviewDetailToFormValues, toRegisterBorrowerPayload } from '@/features/borrower-registration/registration.utils';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import { MOCK_REGISTRATION_LEGAL_CONFIG } from '@/mocks/registration-legal';
import type { BorrowerReviewDetail } from '@/types/approval';
import { BORROWER_STATUS } from '@/types/borrower';

const legal: RegistrationLegalConfig = {
  ...MOCK_REGISTRATION_LEGAL_CONFIG,
};

const SAMPLE_PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
const SAMPLE_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
const SAMPLE_THUMBPRINT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0k';

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
  borrowerPhotoUrl: SAMPLE_PHOTO,
  guarantorPhotoUrl: SAMPLE_PHOTO,
};

function createReviewDetail(
  overrides: Partial<BorrowerReviewDetail> = {},
): BorrowerReviewDetail {
  return {
    id: '019ffb06-c166-7130-82e6-270cfbfcb5ce',
    displayId: 'BRW-2026-00417',
    fullName: 'Gloria Serwaa',
    phone: '+233551112233',
    status: BORROWER_STATUS.PENDING,
    community: 'Fijai',
    groupName: '',
    groupId: '',
    nationalId: 'A01010',
    registeredAt: '2026-03-01T10:00:00.000Z',
    dateOfBirth: '1990-01-15',
    gender: BORROWER_GENDER.FEMALE,
    nationality: 'Ghanaian',
    idType: BORROWER_ID_TYPE.VOTER_ID,
    idNumber: 'A01010',
    houseAddress: 'House 12',
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
    photoFileName: 'borrower.jpg',
    photoMimeType: 'image/jpeg',
    photoUrl: SAMPLE_PHOTO,
    guarantorPhotoUrl: SAMPLE_PHOTO,
    photoUploadId: 'photo-upload-1',
    guarantorPhotoUploadId: 'guarantor-photo-upload-1',
    borrowerSignatureUploadId: 'borrower-sig-1',
    guarantorSignatureUploadId: 'guarantor-sig-1',
    borrowerThumbprintManual: false,
    guarantorThumbprintManual: false,
    registeredByOfficerName: 'Ama Officer',
    registeredByOfficerId: 'officer-1',
    ...overrides,
  };
}

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
    expect(html).toContain('No photograph available');
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
    expect(shortHtml).toContain('No photograph available');
    expect(longHtml).toContain('Very Long Business Trading Enterprise Name International Limited');
    expect(longHtml).toContain('Long address segment');
  });
});

describe('registration review hotfixes — guarantor, photos, signatures, cleanup', () => {
  it('populates full guarantor details including ID type, ID number, and contact', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', media);
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(content.guarantorRows).toEqual(
      expect.arrayContaining([
        { label: 'Full Name', value: 'Kojo Mensah' },
        { label: 'Contact', value: '+233241234567' },
        { label: 'ID Type', value: 'Ghana Card' },
        { label: 'ID Number', value: 'GHA-123456789-0' },
        { label: 'Relationship', value: 'Spouse' },
      ]),
    );
    expect(html).toContain('Kojo Mensah');
    expect(html).toContain('+233241234567');
    expect(html).toContain('Ghana Card');
    expect(html).toContain('GHA-123456789-0');
  });

  it('renders existing guarantor and applicant passport photos in review/export HTML', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', media);
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(content.borrowerPhotoUrl).toBe(SAMPLE_PHOTO);
    expect(content.guarantorPhotoUrl).toBe(SAMPLE_PHOTO);
    expect(html).toContain(`src="${SAMPLE_PHOTO}"`);
    expect(html).toContain('alt="Applicant passport photograph"');
    expect(html).toContain('alt="Guarantor photograph"');
    expect(html).not.toContain('Photo loaded from the existing WILMS record');
  });

  it('shows No photograph available when guarantor photo is missing', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', {
      borrowerPhotoUrl: SAMPLE_PHOTO,
      guarantorPhotoUrl: null,
    });
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('No photograph available');
    expect(html).toContain(`src="${SAMPLE_PHOTO}"`);
  });

  it('resolves digital signature mode when a signature image is present', () => {
    expect(
      resolveSignatureCaptureMode({
        signatureUrl: SAMPLE_SIGNATURE,
        thumbprintUrl: null,
        manual: false,
      }),
    ).toBe('digital');
  });

  it('resolves thumbprint mode when only a thumbprint image is present', () => {
    expect(
      resolveSignatureCaptureMode({
        signatureUrl: null,
        thumbprintUrl: SAMPLE_THUMBPRINT,
        manual: false,
      }),
    ).toBe('thumbprint');
  });

  it('resolves manual signature mode when manual placeholder is selected', () => {
    expect(
      resolveSignatureCaptureMode({
        signatureUrl: SAMPLE_SIGNATURE,
        thumbprintUrl: SAMPLE_THUMBPRINT,
        manual: true,
      }),
    ).toBe('manual');
  });

  it('renders digital applicant signature and not a blank line', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', {
      ...media,
      borrowerSignatureUrl: SAMPLE_SIGNATURE,
      guarantorSignatureUrl: SAMPLE_SIGNATURE,
    });
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(content.borrowerSignatureMode).toBe('digital');
    expect(content.guarantorSignatureMode).toBe('digital');
    expect(content.borrowerSignature).toBe(SAMPLE_SIGNATURE);
    expect(content.guarantorSignature).toBe(SAMPLE_SIGNATURE);
    expect(content.borrowerThumbprint).toBeNull();
    expect(html).toContain(SAMPLE_SIGNATURE);
    expect(html).toContain('class="signature-image"');
  });

  it('renders manual signature lines when manual mode is selected', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', {
      ...media,
      borrowerSignatureUrl: SAMPLE_SIGNATURE,
      guarantorSignatureUrl: SAMPLE_SIGNATURE,
      borrowerThumbprintManual: true,
      guarantorThumbprintManual: true,
    });
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(content.borrowerSignatureMode).toBe('manual');
    expect(content.guarantorSignatureMode).toBe('manual');
    expect(content.borrowerSignature).toBeNull();
    expect(content.guarantorSignature).toBeNull();
    expect(html).toContain('sig-blank');
    expect(html).not.toContain(SAMPLE_SIGNATURE);
  });

  it('renders thumbprint capture when selected instead of digital signature', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', {
      ...media,
      borrowerThumbprintUrl: SAMPLE_THUMBPRINT,
      guarantorThumbprintUrl: SAMPLE_THUMBPRINT,
    });
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(content.borrowerSignatureMode).toBe('thumbprint');
    expect(content.guarantorSignatureMode).toBe('thumbprint');
    expect(content.borrowerThumbprint).toBe(SAMPLE_THUMBPRINT);
    expect(content.borrowerSignature).toBeNull();
    expect(html).toContain(SAMPLE_THUMBPRINT);
    expect(html).toContain('class="signature-image"');
  });

  it('preserves guarantor signature state and does not show digital and manual together', () => {
    const digital = buildRegistrationAgreementContent(createValues(), legal, 'Officer', {
      ...media,
      guarantorSignatureUrl: SAMPLE_SIGNATURE,
    });
    const manual = buildRegistrationAgreementContent(createValues(), legal, 'Officer', {
      ...media,
      guarantorThumbprintManual: true,
    });

    expect(digital.guarantorSignatureMode).toBe('digital');
    expect(digital.guarantorSignature).toBe(SAMPLE_SIGNATURE);
    expect(manual.guarantorSignatureMode).toBe('manual');
    expect(manual.guarantorSignature).toBeNull();

    const digitalHtml = buildRegistrationAgreementPrintHtml(digital);
    const manualHtml = buildRegistrationAgreementPrintHtml(manual);
    expect(digitalHtml).toContain(SAMPLE_SIGNATURE);
    expect(manualHtml).toContain('sig-blank');
  });

  it('preserves signature state from registration review detail through export content', () => {
    const detail = createReviewDetail({
      borrowerSignatureUploadId: 'borrower-sig-1',
      guarantorThumbprintManual: true,
      guarantorSignatureUploadId: null,
    });
    const values = reviewDetailToFormValues(detail);
    const payload = toRegisterBorrowerPayload(
      {
        ...values,
        gender: BORROWER_GENDER.FEMALE,
        idType: BORROWER_ID_TYPE.VOTER_ID,
        guarantorIdType: BORROWER_ID_TYPE.GHANA_CARD,
        photo: new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
        guarantorPhoto: null,
        idDocument: null,
      } as import('@/features/borrower-registration/registration.schema').BorrowerRegistrationInput,
      'officer-1',
    );

    expect(values.guarantorIdType).toBe(BORROWER_ID_TYPE.GHANA_CARD);
    expect(values.guarantorIdNumber).toBe('GHA-123456789-0');
    expect(values.guarantorPhone).toBe('+233241234567');
    expect(values.guarantorPreviewUrl).toBe(SAMPLE_PHOTO);
    expect(values.photoPreviewUrl).toBe(SAMPLE_PHOTO);
    expect(values.borrowerSignatureUploadId).toBe('borrower-sig-1');
    expect(values.guarantorThumbprintManualPlaceholder).toBe(true);
    expect(payload.guarantorIdType).toBe(BORROWER_ID_TYPE.GHANA_CARD);
    expect(payload.guarantorIdNumber).toBe('GHA-123456789-0');
    expect(payload.borrowerSignatureUploadId).toBe('borrower-sig-1');
    expect(payload.guarantorThumbprintManualPlaceholder).toBe(true);
  });

  it('omits redundant reference and status presentation from exported HTML', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', media, {
      registrationReference: 'BRW-2026-00417',
      applicationStatus: 'PENDING',
    });
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).not.toContain('Registration / Application Reference');
    expect(html).not.toContain('Borrower ID');
    expect(html).not.toContain('Application Status');
    expect(html).not.toContain('Reference: Pending');
    expect(html).not.toContain('Reference: BRW-2026-00417');
    expect(html).not.toContain('Status: PENDING');
    expect(html).not.toContain('Status: Pending');
    expect(content.applicantRows.some((row) => row.label.includes('Reference'))).toBe(false);
    expect(content.applicantRows.some((row) => row.label.includes('Status'))).toBe(false);
    expect(content.applicantRows.some((row) => row.label.includes('Borrower ID'))).toBe(false);
  });

  it('does not expose UUIDs in the user-facing document', () => {
    const uuid = '019ffb06-c166-7130-82e6-270cfbfcb5ce';
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', media, {
      registrationReference: uuid,
      officerId: uuid,
    });
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(content.registrationReference).toBeNull();
    expect(html).not.toContain(uuid);
  });

  it('keeps Ghana Digital Address and location hierarchy fields', () => {
    const content = buildRegistrationAgreementContent(createValues(), legal, 'Officer', media);
    const html = buildRegistrationAgreementPrintHtml(content);

    expect(html).toContain('WS-123-4567');
    expect(html).toContain('Fijai');
    expect(html).toContain('Western');
    expect(html).toContain('Sekondi Takoradi Metro');
  });
});
