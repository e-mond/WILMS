import {
  GUARANTOR_VALIDATION_STATUS,
  MAX_GUARANTOR_GUARANTEES,
  type GuarantorEligibilityInput,
  type GuarantorEligibilityResult,
} from '@/types/guarantor-eligibility';
import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { getBorrowerRegistryEntries } from '@/services/mock/borrower-registry.store';

export function checkGuarantorEligibility(
  input: GuarantorEligibilityInput,
): GuarantorEligibilityResult {
  const normalizedPhone = input.guarantorPhone.trim();
  const normalizedName = input.guarantorName.trim().toLowerCase();
  const borrowerPhone = input.borrowerPhone?.trim();

  if (borrowerPhone && normalizedPhone === borrowerPhone) {
    return {
      isEligible: false,
      activeGuaranteeCount: 0,
      maxGuarantees: MAX_GUARANTOR_GUARANTEES,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
      message: 'Guarantor phone must differ from borrower phone.',
    };
  }

  const activeGuaranteeCount = getBorrowerRegistryEntries().filter(
    (entry: BorrowerRegistryEntry) => entry.profile.guarantorPhone === normalizedPhone,
  ).length;

  const duplicateRegistration = getBorrowerRegistryEntries().some((entry: BorrowerRegistryEntry) => {
    const profile = entry.profile;
    return (
      profile.guarantorPhone === normalizedPhone &&
      profile.guarantorName.trim().toLowerCase() === normalizedName
    );
  });

  const isExempt = Boolean(input.isGroupLeader || input.isApprovedCommunityLeader);
  const maxGuarantees = isExempt ? MAX_GUARANTOR_GUARANTEES + 2 : MAX_GUARANTOR_GUARANTEES;

  if (duplicateRegistration) {
    return {
      isEligible: false,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: true,
      validationStatus: GUARANTOR_VALIDATION_STATUS.DUPLICATE,
      message: 'This guarantor profile is already linked to an active registration.',
    };
  }

  if (isExempt) {
    return {
      isEligible: true,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.EXEMPT,
      message: 'Group or community leader exemption applied.',
    };
  }

  if (activeGuaranteeCount >= MAX_GUARANTOR_GUARANTEES) {
    return {
      isEligible: false,
      activeGuaranteeCount,
      maxGuarantees: MAX_GUARANTOR_GUARANTEES,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.AT_LIMIT,
      message: `Guarantor has reached the maximum of ${MAX_GUARANTOR_GUARANTEES} active guarantees.`,
    };
  }

  return {
    isEligible: true,
    activeGuaranteeCount,
    maxGuarantees: MAX_GUARANTOR_GUARANTEES,
    isDuplicateRegistration: false,
    validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
    message: `Current Guarantees: ${activeGuaranteeCount} of ${MAX_GUARANTOR_GUARANTEES}`,
  };
}
