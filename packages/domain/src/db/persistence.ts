import { eq } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from './client.js';
import * as memory from './store.js';
import { borrowerAdminFees } from './schema/borrower-admin-fees.js';
import {
  auditRepository,
  borrowerRepository,
  groupRepository,
  paymentRepository,
} from '../repositories/index.js';
import type { BorrowerListOptions } from '../repositories/borrower.repository.js';
import type { PaymentListOptions } from '../repositories/payment.repository.js';

export { isDatabaseEnabled };

export type { BorrowerRecord, BorrowerStatus, PaymentRecord, GroupRecord, AdminFeeRecord } from './store.js';
export { BORROWER_STATUS } from './store.js';

export type { BorrowerListOptions, PaymentListOptions };

export async function listBorrowers(options?: BorrowerListOptions) {
  return isDatabaseEnabled()
    ? borrowerRepository.listBorrowers(options)
    : memory.listBorrowers();
}

export async function countBorrowers(status?: memory.BorrowerStatus) {
  return isDatabaseEnabled() ? borrowerRepository.countBorrowers(status) : memory.listBorrowers().length;
}

export async function listApprovedBorrowersWithoutAdminFee() {
  if (isDatabaseEnabled()) {
    return borrowerRepository.listApprovedBorrowersWithoutAdminFee();
  }

  return memory
    .listBorrowers()
    .filter(
      (borrower) =>
        borrower.status === memory.BORROWER_STATUS.APPROVED && !memory.hasAdminFee(borrower.id),
    );
}

export async function getBorrower(id: string) {
  return isDatabaseEnabled() ? borrowerRepository.getBorrower(id) : memory.getBorrower(id);
}

export async function saveBorrower(record: memory.BorrowerRecord) {
  return isDatabaseEnabled()
    ? borrowerRepository.saveBorrower(record)
    : memory.saveBorrower(record);
}

export async function deleteBorrower(id: string) {
  return isDatabaseEnabled() ? borrowerRepository.deleteBorrower(id) : memory.deleteBorrower(id);
}

export function nextBorrowerId() {
  return isDatabaseEnabled() ? borrowerRepository.nextBorrowerId() : memory.nextBorrowerId();
}

export async function listPayments(options?: PaymentListOptions) {
  return isDatabaseEnabled() ? paymentRepository.listPayments(options) : memory.listPayments();
}

export async function countPayments(borrowerIds?: string[]) {
  return isDatabaseEnabled()
    ? paymentRepository.countPayments(borrowerIds)
    : memory.listPayments().length;
}

export async function appendPayment(record: memory.PaymentRecord) {
  return isDatabaseEnabled()
    ? paymentRepository.appendPayment(record)
    : memory.appendPayment(record);
}

export async function findSameDayPayment(
  borrowerId: string,
  collectorId: string,
  paymentDate: string,
) {
  return isDatabaseEnabled()
    ? paymentRepository.findSameDayPayment(borrowerId, collectorId, paymentDate)
    : memory.findSameDayPayment(borrowerId, collectorId, paymentDate);
}

export async function findDuplicatePayment(input: {
  borrowerId: string;
  paymentDate: string;
  amountPesewas: number;
}) {
  return isDatabaseEnabled()
    ? paymentRepository.findDuplicatePayment(input)
    : memory.findDuplicatePayment(input);
}

export function nextPaymentId() {
  return isDatabaseEnabled() ? paymentRepository.nextPaymentId() : memory.nextPaymentId();
}

export async function saveGroup(record: memory.GroupRecord) {
  return isDatabaseEnabled() ? groupRepository.saveGroup(record) : memory.saveGroup(record);
}

export async function listGroups() {
  return isDatabaseEnabled() ? groupRepository.listGroups() : memory.listGroups();
}

export async function getApprovedQueue(community: string) {
  return isDatabaseEnabled()
    ? groupRepository.getApprovedQueue(community)
    : memory.getApprovedQueue(community);
}

export async function setApprovedQueue(
  community: string,
  queue: { borrowerId: string; fullName: string; community: string; approvedAt: string }[],
) {
  return isDatabaseEnabled()
    ? groupRepository.setApprovedQueue(community, queue)
    : memory.setApprovedQueue(community, queue);
}

export async function nextGroupSequence(monthKey: string) {
  return isDatabaseEnabled()
    ? groupRepository.nextGroupSequence(monthKey)
    : memory.nextGroupSequence(monthKey);
}

export async function assignBorrowerToGroup(
  borrowerId: string,
  group: memory.GroupRecord,
) {
  return isDatabaseEnabled()
    ? borrowerRepository.assignBorrowerToGroup(borrowerId, group)
    : memory.assignBorrowerToGroup(borrowerId, group);
}

export async function getAdminFee(borrowerId: string) {
  if (isDatabaseEnabled()) {
    const [row] = await getDb()
      .select()
      .from(borrowerAdminFees)
      .where(eq(borrowerAdminFees.borrowerId, borrowerId))
      .limit(1);
    if (!row) {
      return undefined;
    }
    return {
      borrowerId: row.borrowerId,
      transactionId: row.transactionId,
      collectorId: row.collectorUserId,
      amountPesewas: row.amountPesewas,
      recordedAt: row.recordedAt.toISOString(),
    } satisfies memory.AdminFeeRecord;
  }

  return memory.getAdminFee(borrowerId);
}

export async function saveAdminFee(record: memory.AdminFeeRecord) {
  if (isDatabaseEnabled()) {
    await getDb().insert(borrowerAdminFees).values({
      borrowerId: record.borrowerId,
      collectorUserId: record.collectorId,
      amountPesewas: record.amountPesewas,
      transactionId: record.transactionId,
      recordedAt: new Date(record.recordedAt),
    });
    return;
  }

  memory.saveAdminFee(record);
}

export async function hasAdminFee(borrowerId: string) {
  return Boolean(await getAdminFee(borrowerId));
}
