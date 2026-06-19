import { BORROWER_STATUS } from '@/types/borrower';
import type { BorrowerFullProfile, BorrowerRiskSummary } from '@/types/borrower';
import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { getSyntheticBorrowerProfile } from '@/services/mock/group-members.resolver';
import { LOAN_STATUS } from '@/types/loan';
import type { BorrowerLoanHistoryEntry, LoanProgressSummary } from '@/types/loan';

export function resolveBorrowerGroupId(entry: BorrowerRegistryEntry, groupName: string): string {
  if (entry.groupName === 'Sunrise Women') {
    return 'GRP-0033';
  }

  if (entry.groupName === 'Adwoa Nhyira Group') {
    return 'GRP-0041';
  }

  if (entry.groupName === 'Hope Circle') {
    return 'GRP-0029';
  }

  const synthetic = getSyntheticBorrowerProfile(entry.id);
  return synthetic?.groupId ?? `GRP-${groupName.replace(/\s+/g, '-').slice(0, 8).toUpperCase()}`;
}

export function buildBorrowerRiskSummary(
  entry: BorrowerRegistryEntry,
  loans: BorrowerLoanHistoryEntry[],
  progress?: LoanProgressSummary | null,
): BorrowerRiskSummary {
  const activeDefault = loans.some((loan) => loan.status === LOAN_STATUS.DEFAULTED);
  const missedPayments = progress?.totalMissed ?? 0;

  let riskRating = 'Low Risk';

  if (entry.status === BORROWER_STATUS.BLACKLISTED) {
    riskRating = 'Blacklisted';
  } else if (entry.status === BORROWER_STATUS.DEFAULTED || activeDefault) {
    riskRating = 'Defaulted';
  } else if (entry.status === BORROWER_STATUS.AT_RISK || missedPayments >= 2) {
    riskRating = 'At Risk';
  }

  return {
    riskRating,
    missedPaymentCount: missedPayments,
    defaultStatus: activeDefault || entry.status === BORROWER_STATUS.DEFAULTED ? 'Yes' : 'No',
    blacklistStatus: entry.status === BORROWER_STATUS.BLACKLISTED ? 'Blacklisted' : 'Clear',
    flags:
      missedPayments >= 2
        ? ['Missed payment pattern']
        : entry.status === BORROWER_STATUS.AT_RISK
          ? ['Payment consistency below threshold']
          : [],
    notes:
      entry.status === BORROWER_STATUS.BLACKLISTED
        ? ['Borrower is blacklisted and cannot receive new loans.']
        : [],
  };
}

export function buildBorrowerFullProfile(
  entry: BorrowerRegistryEntry,
  loans: BorrowerLoanHistoryEntry[],
  progress?: LoanProgressSummary | null,
): BorrowerFullProfile {
  const synthetic = getSyntheticBorrowerProfile(entry.id);
  const groupId = resolveBorrowerGroupId(entry, entry.groupName);

  return {
    id: entry.id,
    fullName: entry.fullName,
    phone: entry.phone,
    alternativePhone: entry.profile.guarantorPhone,
    status: entry.status,
    groupName: entry.groupName,
    groupId,
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
    idType: entry.idType,
    city: entry.profile.city,
    region: entry.profile.region,
    district: entry.profile.district,
    guarantorName: entry.profile.guarantorName,
    guarantorPhone: entry.profile.guarantorPhone,
    risk: buildBorrowerRiskSummary(entry, loans, progress),
    ...(synthetic
      ? {
          groupId: synthetic.groupId,
          groupName: synthetic.groupName,
          community: synthetic.community,
        }
      : {}),
  };
}

export function buildSyntheticBorrowerFullProfile(
  borrowerId: string,
): BorrowerFullProfile | null {
  const synthetic = getSyntheticBorrowerProfile(borrowerId);

  if (!synthetic) {
    return null;
  }

  return {
    id: borrowerId,
    fullName: synthetic.fullName,
    phone: synthetic.phone,
    alternativePhone: undefined,
    status: synthetic.status,
    groupName: synthetic.groupName,
    groupId: synthetic.groupId,
    nationalId: synthetic.nationalId,
    community: synthetic.community,
    registeredAt: synthetic.registeredAt,
    email: synthetic.email,
    gpsAddress: synthetic.gpsAddress,
    houseAddress: synthetic.address,
    dateOfBirth: '1988-01-15',
    gender: 'Female',
    nationality: 'Ghanaian',
    businessName: `${synthetic.fullName.split(' ')[0]} Enterprise`,
    typeOfWork: 'Trader',
    idType: 'GHANA_CARD',
    city: synthetic.community.split(',')[0] ?? synthetic.community,
    region: 'Greater Accra',
    district: synthetic.community,
    guarantorName: 'Guarantor Contact',
    guarantorPhone: '+233240000001',
    risk: {
      riskRating: synthetic.status === BORROWER_STATUS.DEFAULTED ? 'Defaulted' : 'Low Risk',
      missedPaymentCount: synthetic.status === BORROWER_STATUS.DEFAULTED ? 3 : 0,
      defaultStatus: synthetic.status === BORROWER_STATUS.DEFAULTED ? 'Yes' : 'No',
      blacklistStatus: 'Clear',
      flags: [],
      notes: [],
    },
  };
}
