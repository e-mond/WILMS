import { describe, expect, it } from 'vitest';
import {
  buildLoanWorkflowSteps,
  canApproveLoan,
  canDisburseLoan,
} from '@/features/loan-management/utils/loan-workflow-steps';
import { LOAN_LIFECYCLE, LOAN_STATUS } from '@/types/loan';

describe('loan workflow steps', () => {
  it('marks loan created complete and loan approved current while pending approval', () => {
    const steps = buildLoanWorkflowSteps({
      lifecycleStatus: LOAN_LIFECYCLE.PENDING_APPROVAL,
      status: LOAN_STATUS.PENDING_DISBURSEMENT,
      adminFeePaid: false,
    });
    expect(steps.find((s) => s.id === 'loan_created')?.state).toBe('complete');
    expect(steps.find((s) => s.id === 'loan_approved')?.state).toBe('current');
    expect(steps.find((s) => s.id === 'admin_fee_paid')?.state).toBe('upcoming');
    expect(canApproveLoan(LOAN_LIFECYCLE.PENDING_APPROVAL)).toBe(true);
    expect(canDisburseLoan(LOAN_LIFECYCLE.PENDING_APPROVAL)).toBe(false);
  });

  it('pins current at admin fee after approval until the fee is paid', () => {
    const steps = buildLoanWorkflowSteps({
      lifecycleStatus: LOAN_LIFECYCLE.APPROVED,
      status: LOAN_STATUS.PENDING_DISBURSEMENT,
      adminFeePaid: false,
    });
    expect(steps.find((s) => s.id === 'loan_approved')?.state).toBe('complete');
    expect(steps.find((s) => s.id === 'admin_fee_paid')?.state).toBe('current');
  });

  it('enables disburse only for pending disbursement lifecycle', () => {
    expect(canDisburseLoan(LOAN_LIFECYCLE.PENDING_DISBURSEMENT)).toBe(true);
    expect(canDisburseLoan(LOAN_LIFECYCLE.PENDING_APPROVAL)).toBe(false);
    expect(canApproveLoan(LOAN_LIFECYCLE.PENDING_DISBURSEMENT)).toBe(false);
  });

  it('marks disbursed loans as active current', () => {
    const steps = buildLoanWorkflowSteps({
      lifecycleStatus: LOAN_LIFECYCLE.ACTIVE,
      status: LOAN_STATUS.ACTIVE,
      adminFeePaid: true,
    });
    expect(steps.find((s) => s.id === 'disbursed')?.state).toBe('complete');
    expect(steps.find((s) => s.id === 'active')?.state).toBe('current');
  });
});
