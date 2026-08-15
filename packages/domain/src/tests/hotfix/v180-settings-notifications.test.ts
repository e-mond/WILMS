import { describe, expect, it } from 'vitest';
import {
  encodeFallbackDigitalAddress,
  haversineMetres,
  isGhanaDigitalAddress,
} from '../../modules/locations/digital-address.js';
import { formatGroupAtCapacityMessage } from '../../modules/settings/group-limits.js';
import {
  buildBlacklistSmsBody,
  buildGuarantorLoanApprovedSmsBody,
  buildGuarantorLoanFullyRepaidSmsBody,
  buildGuarantorMissedPaymentsSmsBody,
  buildRegistrationEscalatedSmsBody,
  buildRegistrationRejectedSmsBody,
} from '../../infrastructure/notifications/templates.js';

describe('group capacity messages', () => {
  it('names the group and configured maximum', () => {
    expect(
      formatGroupAtCapacityMessage({
        groupName: 'Airport Ridge Group 001',
        maxGroupSize: 10,
      }),
    ).toBe(
      'Airport Ridge Group 001 has reached the configured maximum size of 10 members. Create a new group or choose another group.',
    );
  });
});

describe('Ghana Digital Address helpers', () => {
  it('accepts official-style codes and encodes a fallback from coordinates', () => {
    expect(isGhanaDigitalAddress('GA-183-4290')).toBe(true);
    expect(isGhanaDigitalAddress('4.934275, -1.750484')).toBe(false);
    const encoded = encodeFallbackDigitalAddress(4.934275, -1.750484, 'WR');
    expect(isGhanaDigitalAddress(encoded)).toBe(true);
    expect(encoded.startsWith('WR-')).toBe(true);
  });

  it('computes a positive distance between two Ghana points', () => {
    expect(haversineMetres(5.6, -0.18, 5.61, -0.19)).toBeGreaterThan(0);
  });
});

describe('registration and guarantor SMS copy', () => {
  it('uses professional borrower decision wording', () => {
    expect(buildRegistrationRejectedSmsBody({ borrowerName: 'Ama' })).toContain('was not approved');
    expect(buildBlacklistSmsBody({ borrowerName: 'Ama' })).not.toContain('flagged');
    expect(buildRegistrationEscalatedSmsBody({ borrowerName: 'Ama' })).toContain('additional review');
  });

  it('uses the mandated guarantor templates', () => {
    expect(
      buildGuarantorLoanApprovedSmsBody({ guarantorName: 'Kofi', borrowerName: 'Ama' }),
    ).toContain('whom you guaranteed, has been approved');
    expect(
      buildGuarantorLoanFullyRepaidSmsBody({ guarantorName: 'Kofi', borrowerName: 'Ama' }),
    ).toContain('guarantee obligation has now ended');
    expect(
      buildGuarantorMissedPaymentsSmsBody({ guarantorName: 'Kofi', borrowerName: 'Ama' }),
    ).toContain('missed multiple scheduled repayments');
  });
});
