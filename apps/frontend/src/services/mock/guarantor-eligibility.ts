import { BORROWER_STATUS } from '@/types/borrower';
import {
  GUARANTOR_VALIDATION_STATUS,
  MAX_GUARANTOR_GUARANTEES,
  type GuarantorEligibilityInput,
  type GuarantorEligibilityResult,
} from '@/types/guarantor-eligibility';
import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { getBorrowerRegistryEntries } from '@/services/mock/borrower-registry.store';

const ACTIVE_STATUSES = new Set<string>([
  BORROWER_STATUS.PENDING,
  BORROWER_STATUS.APPROVED,
  BORROWER_STATUS.AT_RISK,
  BORROWER_STATUS.DEFAULTED,
]);

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  if (digits.startsWith('233')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `233${digits.slice(1)}`;
  }
  return digits;
}

function phonesMatch(left?: string | null, right?: string | null): boolean {
  if (!left?.trim() || !right?.trim()) {
    return false;
  }
  return normalizePhone(left) === normalizePhone(right);
}

function scoreFromMetrics(activeGuaranteeCount: number, maxGuarantees: number): {
  eligibilityScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  scoreFactors: string[];
} {
  const utilization = activeGuaranteeCount / Math.max(maxGuarantees, 1);
  const factors: string[] = [];
  let score = 100;

  if (utilization >= 1) {
    score -= 40;
    factors.push('Maximum active guarantees reached');
  } else if (utilization >= 0.66) {
    score -= 20;
    factors.push('High guarantee utilization');
  }

  const eligibilityScore = Math.max(0, Math.min(100, score));
  const riskRating =
    eligibilityScore >= 75 ? 'LOW' : eligibilityScore >= 50 ? 'MEDIUM' : 'HIGH';

  return { eligibilityScore, riskRating, scoreFactors: factors };
}

function isSameBorrower(entry: BorrowerRegistryEntry, input: GuarantorEligibilityInput): boolean {
  if (phonesMatch(entry.phone, input.borrowerPhone)) {
    return true;
  }
  return Boolean(
    input.borrowerIdNumber?.trim() &&
      entry.idNumber.trim().toLowerCase() === input.borrowerIdNumber.trim().toLowerCase(),
  );
}

export function checkGuarantorEligibility(
  input: GuarantorEligibilityInput,
): GuarantorEligibilityResult {
  const normalizedPhone = input.guarantorPhone.trim();
  const borrowerPhone = input.borrowerPhone?.trim();

  if (borrowerPhone && phonesMatch(normalizedPhone, borrowerPhone)) {
    return {
      isEligible: false,
      activeGuaranteeCount: 0,
      maxGuarantees: MAX_GUARANTOR_GUARANTEES,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
      message: 'Guarantor phone must differ from borrower phone.',
      ...scoreFromMetrics(0, MAX_GUARANTOR_GUARANTEES),
    };
  }

  const linkedActive = getBorrowerRegistryEntries().filter(
    (entry: BorrowerRegistryEntry) =>
      ACTIVE_STATUSES.has(entry.status) && phonesMatch(entry.profile.guarantorPhone, normalizedPhone),
  );

  const duplicateForSameBorrower = linkedActive.some((entry) => isSameBorrower(entry, input));
  const activeGuaranteeCount = linkedActive.filter((entry) => !isSameBorrower(entry, input)).length;

  const isExempt = Boolean(input.isGroupLeader || input.isApprovedCommunityLeader);
  const maxGuarantees = isExempt ? MAX_GUARANTOR_GUARANTEES + 2 : MAX_GUARANTOR_GUARANTEES;
  const score = scoreFromMetrics(activeGuaranteeCount, maxGuarantees);

  if (duplicateForSameBorrower) {
    return {
      isEligible: false,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: true,
      validationStatus: GUARANTOR_VALIDATION_STATUS.DUPLICATE,
      message: 'This guarantor is already linked to an active registration for the same borrower.',
      ...score,
    };
  }

  if (isExempt) {
    return {
      isEligible: true,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.EXEMPT,
      message: `Current Guarantees: ${activeGuaranteeCount} of ${maxGuarantees} (leader exemption applied).`,
      ...score,
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
      ...score,
    };
  }

  return {
    isEligible: true,
    activeGuaranteeCount,
    maxGuarantees: MAX_GUARANTOR_GUARANTEES,
    isDuplicateRegistration: false,
    validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
    message: `Current Guarantees: ${activeGuaranteeCount} of ${MAX_GUARANTOR_GUARANTEES}`,
    ...score,
  };
}
