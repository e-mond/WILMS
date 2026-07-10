import { randomUUID } from 'node:crypto';
import { BORROWER_STATUS, type BorrowerStatus } from '@wilms/shared-contracts';

export { BORROWER_STATUS, type BorrowerStatus };

export interface BorrowerProfile {
  dateOfBirth: string;
  gender: string;
  email?: string;
  nationality: string;
  houseAddress: string;
  gpsAddress: string;
  city: string;
  region: string;
  district: string;
  businessName: string;
  businessAddress: string;
  typeOfWork: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  photoFileName: string;
  photoMimeType: string;
  photoUploadId?: string;
  guarantorPhotoUploadId?: string;
}

export interface BorrowerRecord {
  id: string;
  fullName: string;
  phone: string;
  idType: string;
  idNumber: string;
  status: BorrowerStatus;
  hasActiveLoan: boolean;
  groupName: string;
  groupId?: string;
  community: string;
  registeredAt: string;
  registeredByOfficerId: string;
  profile: BorrowerProfile;
  rejectionReason?: string;
}

export interface PaymentRecord {
  id: string;
  borrowerId: string;
  collectorId: string;
  amountPesewas: number;
  paymentDate: string;
  recordedAt: string;
  gps?: { latitude: number; longitude: number; accuracyMeters?: number };
}

export interface GroupRecord {
  id: string;
  systemId: string;
  name: string;
  displayName: string;
  community: string;
  memberIds: string[];
  formedAt: string;
}

export interface AdminFeeRecord {
  borrowerId: string;
  transactionId: string;
  collectorId: string;
  amountPesewas: number;
  recordedAt: string;
}

const borrowers = new Map<string, BorrowerRecord>();
const payments: PaymentRecord[] = [];
const groups = new Map<string, GroupRecord>();
const adminFees = new Map<string, AdminFeeRecord>();
const approvedByCommunity = new Map<string, { borrowerId: string; fullName: string; community: string; approvedAt: string }[]>();
const groupSequenceByMonth = new Map<string, number>();

function seedBorrowers(): void {
  const pending: BorrowerRecord[] = [
    {
      id: 'borrower-pending-001',
      fullName: 'Adjoa Serwaa',
      phone: '+233244222333',
      idType: 'GHANA_CARD',
      idNumber: 'GHA-998877665',
      status: BORROWER_STATUS.PENDING,
      hasActiveLoan: false,
      groupName: '',
      community: 'Accra',
      registeredAt: '2026-05-28T09:15:00.000Z',
      registeredByOfficerId: 'user-officer',
      profile: {
        dateOfBirth: '1992-08-04',
        gender: 'FEMALE',
        nationality: 'Ghanaian',
        houseAddress: '22 Oxford Street',
        gpsAddress: 'GA-778-3344',
        city: 'Accra',
        region: 'Greater Accra',
        district: 'Osu Klottey',
        businessName: 'Adjoa Provisions',
        businessAddress: 'Oxford Street Market',
        typeOfWork: 'Trader',
        guarantorName: 'Esi Owusu',
        guarantorPhone: '+233244222334',
        guarantorRelationship: 'Sibling',
        photoFileName: 'adjoa-passport.jpg',
        photoMimeType: 'image/jpeg',
      },
    },
    {
      id: 'borrower-pending-002',
      fullName: 'Kwame Osei',
      phone: '+233209988776',
      idType: 'VOTER_ID',
      idNumber: 'VID-445566778',
      status: BORROWER_STATUS.PENDING,
      hasActiveLoan: false,
      groupName: '',
      community: 'Madina',
      registeredAt: '2026-06-01T11:40:00.000Z',
      registeredByOfficerId: 'user-officer',
      profile: {
        dateOfBirth: '1988-11-19',
        gender: 'MALE',
        nationality: 'Ghanaian',
        houseAddress: '14 Atomic Road',
        gpsAddress: 'GA-556-7788',
        city: 'Madina',
        region: 'Greater Accra',
        district: 'La Nkwantanang',
        businessName: 'Kwame Electronics',
        businessAddress: 'Madina Zongo Junction',
        typeOfWork: 'Repair services',
        guarantorName: 'Abena Osei',
        guarantorPhone: '+233244556677',
        guarantorRelationship: 'Spouse',
        photoFileName: 'kwame-passport.jpg',
        photoMimeType: 'image/jpeg',
      },
    },
  ];

  for (const record of pending) {
    borrowers.set(record.id, record);
  }
}

seedBorrowers();

export function nextBorrowerId(): string {
  return `borrower-${randomUUID().slice(0, 8)}`;
}

export function nextPaymentId(): string {
  return `payment-${randomUUID().slice(0, 8)}`;
}

export function listBorrowers(): BorrowerRecord[] {
  return Array.from(borrowers.values());
}

export function getBorrower(id: string): BorrowerRecord | undefined {
  return borrowers.get(id);
}

export function saveBorrower(record: BorrowerRecord): BorrowerRecord {
  borrowers.set(record.id, record);
  return record;
}

export function deleteBorrower(id: string): boolean {
  return borrowers.delete(id);
}

export function listPayments(): PaymentRecord[] {
  return [...payments];
}

export function appendPayment(record: PaymentRecord): PaymentRecord {
  payments.push(record);
  return record;
}

export function findSameDayPayment(
  borrowerId: string,
  collectorId: string,
  paymentDate: string,
): PaymentRecord | undefined {
  return payments.find(
    (payment) =>
      payment.borrowerId === borrowerId &&
      payment.collectorId === collectorId &&
      payment.paymentDate === paymentDate,
  );
}

export function findDuplicatePayment(input: {
  borrowerId: string;
  paymentDate: string;
  amountPesewas: number;
}): PaymentRecord | undefined {
  return payments.find(
    (payment) =>
      payment.borrowerId === input.borrowerId &&
      payment.paymentDate === input.paymentDate &&
      payment.amountPesewas === input.amountPesewas,
  );
}

export function saveGroup(record: GroupRecord): GroupRecord {
  groups.set(record.id, record);
  return record;
}

export function listGroups(): GroupRecord[] {
  return Array.from(groups.values());
}

export function getApprovedQueue(community: string) {
  const key = community.trim().toLowerCase();
  return approvedByCommunity.get(key) ?? [];
}

export function setApprovedQueue(
  community: string,
  queue: { borrowerId: string; fullName: string; community: string; approvedAt: string }[],
): void {
  approvedByCommunity.set(community.trim().toLowerCase(), queue);
}

export function nextGroupSequence(monthKey: string): number {
  const next = (groupSequenceByMonth.get(monthKey) ?? 0) + 1;
  groupSequenceByMonth.set(monthKey, next);
  return next;
}

export function assignBorrowerToGroup(borrowerId: string, group: GroupRecord): void {
  const borrower = borrowers.get(borrowerId);

  if (!borrower) {
    return;
  }

  borrower.groupId = group.id;
  borrower.groupName = group.displayName;
  borrowers.set(borrowerId, borrower);
}

export function getAdminFee(borrowerId: string): AdminFeeRecord | undefined {
  return adminFees.get(borrowerId);
}

export function saveAdminFee(record: AdminFeeRecord): void {
  adminFees.set(record.borrowerId, record);
}

export function hasAdminFee(borrowerId: string): boolean {
  return adminFees.has(borrowerId);
}

export function listBorrowersAwaitingAdminFeeInMemory(requiredAmountPesewas: number): Array<{
  id: string;
  fullName: string;
  phone: string;
  community: string;
  groupName: string;
  requiredAmountPesewas: number;
}> {
  return [...borrowers.values()]
    .filter((borrower) => borrower.status === BORROWER_STATUS.APPROVED && !adminFees.has(borrower.id))
    .map((borrower) => ({
      id: borrower.id,
      fullName: borrower.fullName,
      phone: borrower.phone,
      community: borrower.community,
      groupName: borrower.groupName || '—',
      requiredAmountPesewas,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}
