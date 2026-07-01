import { describe, expect, it } from 'vitest';
import { BORROWER_STATUS, type BorrowerStatus } from '@wilms/shared-contracts';
import { buildBorrowerRiskSummary } from '../../modules/borrowers/borrower-risk.js';
import type { BorrowerRecord } from '../../db/store.js';

function makeRecord(status: BorrowerStatus): BorrowerRecord {
  return {
    id: 'borrower-001',
    fullName: 'Test Borrower',
    phone: '+233200000000',
    idType: 'GHANA_CARD',
    idNumber: 'GHA-123456789-0',
    status,
    hasActiveLoan: false,
    groupName: 'Test Group',
    community: 'Accra',
    registeredAt: '2025-01-01T00:00:00.000Z',
    registeredByOfficerId: 'officer-001',
    profile: {
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      nationality: 'Ghanaian',
      houseAddress: '123 Main St',
      gpsAddress: 'GA-123-4567',
      city: 'Accra',
      region: 'Greater Accra',
      district: 'Madina',
      businessName: 'Test Business',
      businessAddress: '123 Main St',
      typeOfWork: 'Trader',
      guarantorName: 'Guarantor',
      guarantorPhone: '+233200000001',
      guarantorRelationship: 'Sibling',
      photoFileName: 'photo.jpg',
      photoMimeType: 'image/jpeg',
    },
  };
}

describe('buildBorrowerRiskSummary', () => {
  it('returns low risk for approved borrowers without loan issues', () => {
    const risk = buildBorrowerRiskSummary(makeRecord(BORROWER_STATUS.APPROVED), [], null);

    expect(risk.riskRating).toBe('Low Risk');
    expect(risk.missedPaymentCount).toBe(0);
    expect(risk.defaultStatus).toBe('No');
    expect(risk.blacklistStatus).toBe('Clear');
    expect(risk.flags).toEqual([]);
  });

  it('returns blacklisted rating for blacklisted borrowers', () => {
    const risk = buildBorrowerRiskSummary(makeRecord(BORROWER_STATUS.BLACKLISTED), [], null);

    expect(risk.riskRating).toBe('Blacklisted');
    expect(risk.blacklistStatus).toBe('Blacklisted');
    expect(risk.notes.length).toBeGreaterThan(0);
  });

  it('returns at risk when missed payments exceed threshold', () => {
    const risk = buildBorrowerRiskSummary(makeRecord(BORROWER_STATUS.APPROVED), [], {
      totalMissed: 2,
    });

    expect(risk.riskRating).toBe('At Risk');
    expect(risk.missedPaymentCount).toBe(2);
    expect(risk.flags).toContain('Missed payment pattern');
  });

  it('returns defaulted when borrower has a defaulted loan', () => {
    const risk = buildBorrowerRiskSummary(makeRecord(BORROWER_STATUS.APPROVED), [
      { status: 'DEFAULTED' },
    ], null);

    expect(risk.riskRating).toBe('Defaulted');
    expect(risk.defaultStatus).toBe('Yes');
  });
});
