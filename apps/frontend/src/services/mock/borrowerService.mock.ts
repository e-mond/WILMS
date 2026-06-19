import { API_ERROR_CODE, ApiError } from '@/types/api';
import { BORROWER_STATUS } from '@/types/borrower';
import type {
  BorrowerDetail,
  BorrowerSummary,
  OfficerRegistrationSummary,
  PendingApplicationSummary,
} from '@/types/borrower';
import {
  canDeleteRegistration,
  canEditRegistration,
  resolveRegistrationWorkflowStatus,
} from '@/utils/registration-workflow.utils';
import { getOfficerDisplayName } from '@/services/mock/officer-display-name';
import type { RegisterBorrowerPayload } from '@/types/borrower-registration';
import type { IBorrowerService } from '@/types/services';
import {
  checkActiveLoan,
  checkBlacklist,
  checkIdDuplicate,
  checkPhoneDuplicate,
  checkSimilarNames,
} from '@/services/mock/borrower-checks.mock';
import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { AUDIT_ACTION, type AuditAction } from '@/constants/audit';
import type { BorrowerReviewDetail, ReviewedApplicationSummary, ReviewedDecision } from '@/types/approval';
import auditServiceMock from '@/services/mock/auditService.mock';
import loanServiceMock from '@/services/mock/loanService.mock';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import { LOAN_STATUS } from '@/types/loan';
import { logger } from '@/utils/logger';
import { NOTIFICATION_CHANNEL, NOTIFICATION_EVENT } from '@/types/notification';
import {
  buildBorrowerFullProfile,
  buildSyntheticBorrowerFullProfile,
  resolveBorrowerGroupId,
} from '@/services/mock/borrower-full-profile.builder';
import {
  addBorrowerRegistryEntry,
  getBorrowerRegistryEntries,
  getBorrowerRegistryEntry,
  removeBorrowerRegistryEntry,
  resetBorrowerRegistry,
  updateBorrowerRegistryStatus,
} from '@/services/mock/borrower-registry.store';
import { simulateDelay } from '@/services/mock/delay';
import groupFormationServiceMock from '@/services/mock/groupFormationService.mock';

import { resolveMockPhotoUrl } from '@/services/mock/photo-url.resolver';

function registryEntryPhotoUrl(entry: BorrowerRegistryEntry): string {
  return resolveMockPhotoUrl({
    name: entry.fullName,
    id: entry.id,
    photoFileName: entry.profile.photoFileName,
    photoUploadId: entry.profile.photoUploadId,
  });
}

function registryEntryToSummary(entry: BorrowerRegistryEntry): BorrowerSummary {
  return {
    id: entry.id,
    fullName: entry.fullName,
    phone: entry.phone,
    status: entry.status,
    groupName: entry.groupName,
    groupId: resolveBorrowerGroupId(entry, entry.groupName),
    photoUrl: registryEntryPhotoUrl(entry),
  };
}

function registryEntryToPendingApplication(entry: BorrowerRegistryEntry): PendingApplicationSummary {
  return {
    id: entry.id,
    fullName: entry.fullName,
    phone: entry.phone,
    community: entry.community,
    registeredAt: entry.registeredAt,
    registeredByOfficerName: getOfficerDisplayName(entry.registeredByOfficerId),
  };
}

function registryEntryToRegistration(entry: BorrowerRegistryEntry): OfficerRegistrationSummary {
  const registrationStatus = resolveRegistrationWorkflowStatus(entry.status, entry.registeredAt);

  return {
    id: entry.id,
    fullName: entry.fullName,
    phone: entry.phone,
    status: entry.status,
    registrationStatus,
    community: entry.community,
    registeredAt: entry.registeredAt,
    canEdit: canEditRegistration(registrationStatus),
    canDelete: canDeleteRegistration(registrationStatus),
    photoUrl: registryEntryPhotoUrl(entry),
  };
}

function registryEntryToDetail(entry: BorrowerRegistryEntry): BorrowerDetail {
  return {
    ...registryEntryToSummary(entry),
    groupId: resolveBorrowerGroupId(entry, entry.groupName),
    nationalId: entry.idNumber,
    community: entry.community,
    registeredAt: entry.registeredAt,
    email: entry.profile.email,
    gpsAddress: entry.profile.gpsAddress,
    houseAddress: entry.profile.houseAddress,
    dateOfBirth: entry.profile.dateOfBirth,
    gender: entry.profile.gender,
    nationality: entry.profile.nationality,
    businessName: entry.profile.businessName,
    typeOfWork: entry.profile.typeOfWork,
    alternativePhone: entry.profile.guarantorPhone,
  };
}

function registryEntryToReview(entry: BorrowerRegistryEntry): BorrowerReviewDetail {
  return {
    ...registryEntryToDetail(entry),
    dateOfBirth: entry.profile.dateOfBirth,
    gender: entry.profile.gender,
    email: entry.profile.email,
    nationality: entry.profile.nationality,
    idType: entry.idType,
    idNumber: entry.idNumber,
    houseAddress: entry.profile.houseAddress,
    gpsAddress: entry.profile.gpsAddress,
    city: entry.profile.city,
    region: entry.profile.region,
    district: entry.profile.district,
    businessName: entry.profile.businessName,
    businessAddress: entry.profile.businessAddress,
    typeOfWork: entry.profile.typeOfWork,
    guarantorName: entry.profile.guarantorName,
    guarantorPhone: entry.profile.guarantorPhone,
    guarantorRelationship: entry.profile.guarantorRelationship,
    photoFileName: entry.profile.photoFileName,
    photoMimeType: entry.profile.photoMimeType,
    photoUrl: registryEntryPhotoUrl(entry),
    guarantorPhotoUrl: resolveMockPhotoUrl({
      name: entry.profile.guarantorName,
      id: `${entry.id}-guarantor`,
      photoUploadId: entry.profile.guarantorPhotoUploadId,
    }),
    registeredByOfficerName: getOfficerDisplayName(entry.registeredByOfficerId),
  };
}

function assertPendingBorrower(id: string): BorrowerRegistryEntry {
  const entry = getBorrowerRegistryEntry(id);

  if (!entry) {
    throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  if (entry.status !== BORROWER_STATUS.PENDING) {
    throw new ApiError(
      'Only pending applications can be reviewed.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  return entry;
}

function assertReasonProvided(reason: string | undefined, action: string): void {
  if (!reason?.trim()) {
    throw new ApiError(`A reason is required to ${action} this application.`, API_ERROR_CODE.VALIDATION, 422);
  }
}

function assertRegistrationAllowed(payload: RegisterBorrowerPayload): void {
  const phoneResult = checkPhoneDuplicate(payload.phone);
  if (phoneResult.isDuplicate) {
    throw new ApiError(
      `Phone number is already registered to ${phoneResult.existingBorrowerName}.`,
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  const idResult = checkIdDuplicate(payload.idType, payload.idNumber);
  if (idResult.isDuplicate) {
    throw new ApiError(
      `This ID is already registered to ${idResult.existingBorrowerName}.`,
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  const activeLoanResult = checkActiveLoan(payload.phone);
  if (activeLoanResult.hasActiveLoan) {
    throw new ApiError(
      `${activeLoanResult.existingBorrowerName} already has an active loan.`,
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  const blacklistResult = checkBlacklist({
    fullName: payload.fullName,
    phone: payload.phone,
    idType: payload.idType,
    idNumber: payload.idNumber,
  });

  if (blacklistResult.isBlacklisted) {
    throw new ApiError(
      `${blacklistResult.existingBorrowerName} is blacklisted and cannot be registered.`,
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }
}

const borrowerServiceMock: IBorrowerService = {
  async listBorrowers() {
    await simulateDelay();
    return getBorrowerRegistryEntries().map(registryEntryToSummary);
  },

  async listMyRegistrations(officerId: string) {
    await simulateDelay();
    return getBorrowerRegistryEntries()
      .filter((entry) => entry.registeredByOfficerId === officerId)
      .map(registryEntryToRegistration)
      .sort(
        (left, right) =>
          new Date(right.registeredAt).getTime() - new Date(left.registeredAt).getTime(),
      );
  },

  async listPendingApplications() {
    await simulateDelay();
    return getBorrowerRegistryEntries()
      .filter((entry) => entry.status === BORROWER_STATUS.PENDING)
      .map(registryEntryToPendingApplication)
      .sort(
        (left, right) =>
          new Date(right.registeredAt).getTime() - new Date(left.registeredAt).getTime(),
      );
  },

  async listReviewedApplications(approverId: string) {
    await simulateDelay();

    const reviewActions: AuditAction[] = [
      AUDIT_ACTION.BORROWER_APPROVED,
      AUDIT_ACTION.BORROWER_REJECTED,
      AUDIT_ACTION.BORROWER_BLACKLISTED,
    ];

    const entries = await auditServiceMock.listRecentEntries({
      actorId: approverId,
      limit: 100,
    });

    const decisionByAction: Record<string, ReviewedDecision> = {
      [AUDIT_ACTION.BORROWER_APPROVED]: 'APPROVED',
      [AUDIT_ACTION.BORROWER_REJECTED]: 'REJECTED',
      [AUDIT_ACTION.BORROWER_BLACKLISTED]: 'BLACKLISTED',
    };

    return entries
      .filter((entry) => reviewActions.includes(entry.action))
      .map((entry): ReviewedApplicationSummary => {
        const borrower = getBorrowerRegistryEntry(entry.targetEntityId);

        return {
          borrowerId: entry.targetEntityId,
          borrowerName: borrower?.fullName ?? entry.targetEntityId,
          community: borrower?.community ?? '—',
          decision: decisionByAction[entry.action],
          reason: entry.reason,
          reviewedAt: entry.createdAt,
        };
      });
  },

  async getBorrower(id: string) {
    await simulateDelay();
    const borrower = getBorrowerRegistryEntry(id);

    if (borrower) {
      return registryEntryToDetail(borrower);
    }

    const synthetic = buildSyntheticBorrowerFullProfile(id);

    if (synthetic) {
      return synthetic;
    }

    throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
  },

  async getBorrowerFullProfile(id: string) {
    await simulateDelay();
    const borrower = getBorrowerRegistryEntry(id);

    if (borrower) {
      const loans = await loanServiceMock.listBorrowerLoans(id);
      const activeLoan = loans.find((loan) => loan.status === LOAN_STATUS.ACTIVE) ?? loans[0];
      const progress = activeLoan ? await loanServiceMock.getLoanProgress(activeLoan.id) : null;

      return buildBorrowerFullProfile(borrower, loans, progress);
    }

    const synthetic = buildSyntheticBorrowerFullProfile(id);

    if (synthetic) {
      return synthetic;
    }

    throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
  },

  async getBorrowerReview(id: string) {
    await simulateDelay();
    const borrower = getBorrowerRegistryEntries().find((entry) => entry.id === id);

    if (!borrower) {
      throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    return registryEntryToReview(borrower);
  },

  async approveBorrower(id: string) {
    await simulateDelay();
    assertPendingBorrower(id);
    const updated = updateBorrowerRegistryStatus(id, BORROWER_STATUS.APPROVED);

    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.REGISTRATION_APPROVED,
      channels: [NOTIFICATION_CHANNEL.SMS, NOTIFICATION_CHANNEL.EMAIL],
      recipientPhone: updated.phone,
      recipientEmail: updated.profile.email,
      borrowerId: updated.id,
      message: `WILMS: Congratulations ${updated.fullName}, your registration has been approved.`,
    });

    await groupFormationServiceMock.processApprovedBorrower({
      borrowerId: updated.id,
      fullName: updated.fullName,
      community: updated.profile.city,
      approvedAt: new Date().toISOString(),
    });

    return registryEntryToSummary(updated);
  },

  async rejectBorrower(id: string, input) {
    await simulateDelay();
    assertPendingBorrower(id);
    assertReasonProvided(input.reason, 'reject');
    const updated = updateBorrowerRegistryStatus(id, BORROWER_STATUS.REJECTED);

    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.REGISTRATION_REJECTED,
      channels: [NOTIFICATION_CHANNEL.SMS],
      recipientPhone: updated.phone,
      borrowerId: updated.id,
      message: `WILMS: ${updated.fullName}, your registration was not approved. Reason: ${input.reason.trim()}`,
    });

    return registryEntryToSummary(updated);
  },

  async blacklistBorrower(id: string, input) {
    await simulateDelay();
    assertPendingBorrower(id);
    assertReasonProvided(input.reason, 'blacklist');
    const updated = updateBorrowerRegistryStatus(id, BORROWER_STATUS.BLACKLISTED);
    logger.info('Borrower blacklisted during review', {
      borrowerId: id,
      reason: input.reason.trim(),
    });
    return registryEntryToSummary(updated);
  },

  async registerBorrower(payload: RegisterBorrowerPayload) {
    await simulateDelay();
    assertRegistrationAllowed(payload);

    const entry = addBorrowerRegistryEntry(payload);
    return registryEntryToSummary(entry);
  },

  async deleteRegistration(id: string, officerId: string) {
    await simulateDelay();
    const entry = getBorrowerRegistryEntry(id);

    if (!entry) {
      throw new ApiError('Registration not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    if (entry.registeredByOfficerId !== officerId) {
      throw new ApiError('You can only delete your own registrations.', API_ERROR_CODE.UNAUTHORIZED, 403);
    }

    const registration = registryEntryToRegistration(entry);

    if (!registration.canDelete) {
      throw new ApiError(
        'Only pending registrations can be deleted.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    removeBorrowerRegistryEntry(id);
  },

  async checkPhone(phone: string) {
    await simulateDelay();
    return checkPhoneDuplicate(phone);
  },

  async checkId(idType, idNumber) {
    await simulateDelay();
    return checkIdDuplicate(idType, idNumber);
  },

  async checkName(fullName: string) {
    await simulateDelay();
    return checkSimilarNames(fullName);
  },

  async checkActiveLoan(phone: string) {
    await simulateDelay();
    return checkActiveLoan(phone);
  },

  async checkBlacklist(input) {
    await simulateDelay();
    return checkBlacklist(input);
  },

  async checkGuarantorEligibility(input) {
    await simulateDelay();
    const { checkGuarantorEligibility: evaluate } = await import(
      '@/services/mock/guarantor-eligibility'
    );
    return evaluate(input);
  },
};

export function resetMockBorrowerRegistrations(): void {
  resetBorrowerRegistry();
}

export default borrowerServiceMock;
