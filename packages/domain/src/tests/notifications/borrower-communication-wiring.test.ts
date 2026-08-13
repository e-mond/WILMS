import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relative: string): string {
  return readFileSync(join(root, relative), 'utf8');
}

describe('borrower communication emitter wiring', () => {
  it('creates loans without requiring admin fee; disbursement still requires it', () => {
    const loans = read('src/modules/loans/service.ts');
    const createBlock = loans.slice(loans.indexOf('export async function createLoan'), loans.indexOf('export async function approveLoan'));
    const approveBlock = loans.slice(loans.indexOf('export async function approveLoan'), loans.indexOf('export async function rejectLoan'));
    const disburseBlock = loans.slice(loans.indexOf('export async function disburseLoan'));

    expect(createBlock).toContain('notifyLoanCreated');
    expect(createBlock).not.toContain('assertAdminFeeRecorded');
    expect(approveBlock).not.toContain('assertAdminFeeRecorded');
    expect(approveBlock).toContain('notifyLoanApproved');
    expect(approveBlock).toContain('adminFeePesewas');
    expect(disburseBlock).toContain('assertAdminFeeRecorded');
    expect(disburseBlock).toContain('notifyLoanDisbursed');
  });

  it('sends group and collector SMS on reassignment', () => {
    const groups = read('src/modules/groups/service.ts');
    expect(groups).toContain('notifyCollectorReassignedToBorrower');
    expect(groups).toContain('notifyGroupAssigned');
  });

  it('sends a single multi-week payment SMS when weeksCount > 1', () => {
    const payments = read('src/modules/payments/service.ts');
    expect(payments).toContain('weeksPaid: weeksCount');
    expect(payments).toContain('notifyLoanFullyPaid');
    expect(payments).toContain('finalPaymentPesewas');
  });

  it('uses corrected schedule-change SMS builder', () => {
    const ops = read('src/infrastructure/notifications/ops-notifications.ts');
    expect(ops).toContain('buildPaymentDayChangedSmsBody');
  });

  it('sends SMS when a borrower update request is approved or rejected', () => {
    const service = read('src/modules/borrower-updates/service.ts');
    expect(service).toContain('notifyBorrowerUpdateApproved');
    expect(service).toContain('notifyBorrowerUpdateRejected');
    const dispatch = read('src/infrastructure/notifications/event-dispatch.ts');
    expect(dispatch).toContain("event: 'BORROWER_UPDATE_APPROVED'");
    expect(dispatch).toContain("event: 'BORROWER_UPDATE_REJECTED'");
  });
});
