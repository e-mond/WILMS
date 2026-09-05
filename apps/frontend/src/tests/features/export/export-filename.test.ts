import { describe, expect, it } from 'vitest';
import {
  buildBrandedExportFilename,
  buildExportFilename,
} from '@/features/export/utils/formatters';

describe('buildExportFilename', () => {
  it('brands the resource name without appending a date by default', () => {
    expect(buildExportFilename('Audit_Log', 'csv')).toBe('WILMS_Audit_Log.csv');
  });

  it('appends a date only when one is supplied', () => {
    expect(buildExportFilename('Audit Log', 'csv', new Date('2026-07-04T12:00:00.000Z'))).toBe(
      'WILMS_Audit_Log_2026-07-04.csv',
    );
  });
});

describe('buildBrandedExportFilename', () => {
  it('builds official borrower and loan document names', () => {
    expect(
      buildBrandedExportFilename(
        ['Borrower_Registration_Review', 'Gloria Serwaa', 'BRW-2026-00417'],
        'pdf',
      ),
    ).toBe('WILMS_Borrower_Registration_Review_Gloria_Serwaa_BRW-2026-00417.pdf');

    expect(
      buildBrandedExportFilename(
        ['Borrower_Profile', 'Gloria Serwaa', 'BRW-2026-00417'],
        'pdf',
      ),
    ).toBe('WILMS_Borrower_Profile_Gloria_Serwaa_BRW-2026-00417.pdf');

    expect(buildBrandedExportFilename(['Loan_Schedule', 'LN-2026-00124'], 'pdf')).toBe(
      'WILMS_Loan_Schedule_LN-2026-00124.pdf',
    );

    expect(
      buildBrandedExportFilename(['Group_Profile', 'Airport Ridge Group 001'], 'pdf'),
    ).toBe('WILMS_Group_Profile_Airport_Ridge_Group_001.pdf');

    expect(
      buildBrandedExportFilename(['Statement', 'BRW-2026-00417', '2026-08-15'], 'pdf'),
    ).toBe('WILMS_Statement_BRW-2026-00417_2026-08-15.pdf');
  });
});
