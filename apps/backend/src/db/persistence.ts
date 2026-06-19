import { isDatabaseEnabled } from './client.js';
import * as memory from './store.js';
import {
  auditRepository,
  borrowerRepository,
  groupRepository,
  paymentRepository,
} from '../repositories/index.js';

export { isDatabaseEnabled };

export type { BorrowerRecord, BorrowerStatus, PaymentRecord, GroupRecord } from './store.js';
export { BORROWER_STATUS } from './store.js';

export async function listBorrowers() {
  return isDatabaseEnabled() ? borrowerRepository.listBorrowers() : memory.listBorrowers();
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

export async function listPayments() {
  return isDatabaseEnabled() ? paymentRepository.listPayments() : memory.listPayments();
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
