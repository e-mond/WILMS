import { describe, expect, it } from 'vitest';
import {
  buildLoanWorkflowSteps,
  canApproveLoan,
  canDisburseLoan,
} from '@/features/loan-management/utils/loan-workflow-steps';
import { LOAN_LIFECYCLE, LOAN_STATUS } from '@/types/loan';

describe('loan workflow steps', () => {
  it('marks pending approval as current after admin fee', () => {
    const steps = buildLoanWorkflowSteps({
      lifecycleStatus: LOAN_LIFECYCLE.PENDING_APPROVAL,
      status: LOAN_STATUS.PENDING_DISBURSEMENT,
      adminFeePaid: true,
    });
    expect(steps.find((s) => s.id === 'admin_fee_paid')?.state).toBe('complete');
    expect(steps.find((s) => s.id === 'approved')?.state).toBe('current');
    expect(canApproveLoan(LOAN_LIFECYCLE.PENDING_APPROVAL)).toBe(true);
    expect(canDisburseLoan(LOAN_LIFECYCLE.PENDING_APPROVAL)).toBe(false);
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
