/**
 * P14.3A.1 — Financial verification harness (no DATABASE_URL required).
 */
import {
  assertDivisibleLoanAmount,
  calculateWeeklyPaymentPesewas,
} from '../domain/loan/calculations.js';
import { generateLoanScheduleWeeks } from '../domain/loan/schedule.js';
import {
  applyPaymentToSchedule,
  validatePaymentSubmission,
} from '../domain/payment/allocation.js';
import { decimalToPesewas, pesewasToDecimal } from '../domain/money.js';
import type { ScheduleWeekDto } from '../domain/loan/mappers.js';
import {
  assertLifecycleTransition,
  LOAN_LIFECYCLE,
} from '../domain/loan/lifecycle.js';
import { computePaymentReversalBalance } from '../domain/reversal/balance-effect.js';

export interface VerificationResult {
  name: string;
  passed: boolean;
  detail: string;
}

export function runCalculationChecks(): VerificationResult[] {
  const results: VerificationResult[] = [];

  const amountPesewas = 50000;
  const durationWeeks = 10;
  assertDivisibleLoanAmount(amountPesewas, durationWeeks);
  const weekly = calculateWeeklyPaymentPesewas(amountPesewas, durationWeeks);
  results.push({
    name: 'weekly-installment-floor',
    passed: weekly === 5000,
    detail: `expected 5000, got ${weekly}`,
  });

  const schedule = generateLoanScheduleWeeks({
    durationWeeks,
    weeklyPaymentPesewas: weekly,
    startDate: '2026-05-01',
    paymentDay: 'Friday',
  });
  const scheduleTotal = schedule.reduce((sum, week) => sum + week.amountPesewas, 0);
  results.push({
    name: 'schedule-sum-equals-principal',
    passed: scheduleTotal === amountPesewas,
    detail: `schedule total ${scheduleTotal} vs principal ${amountPesewas}`,
  });

  results.push({
    name: 'installment-count',
    passed: schedule.length === durationWeeks,
    detail: `weeks ${schedule.length}`,
  });

  const decimalRoundTrip = decimalToPesewas(pesewasToDecimal(50000));
  results.push({
    name: 'pesewas-decimal-round-trip',
    passed: decimalRoundTrip === 50000,
    detail: `got ${decimalRoundTrip}`,
  });

  return results;
}

export function runAllocationChecks(): VerificationResult[] {
  const results: VerificationResult[] = [];
  const weeklyPaymentPesewas = 5000;
  const scheduleWeeks: ScheduleWeekDto[] = [
    { weekNumber: 1, dueDate: '2026-05-08', amountPesewas: 5000, status: 'MISSED' },
    { weekNumber: 2, dueDate: '2026-05-15', amountPesewas: 5000, status: 'PENDING' },
  ];

  const partialError = validatePaymentSubmission({
    amountPesewas: 2500,
    weeklyPaymentPesewas,
    paymentDay: 'Friday',
    referenceDate: '2026-05-15',
    scheduleWeeks,
  });
  results.push({
    name: 'rejects-partial-payment',
    passed: Boolean(partialError?.includes('Partial')),
    detail: partialError ?? 'no error',
  });

  const overError = validatePaymentSubmission({
    amountPesewas: 10000,
    weeklyPaymentPesewas,
    paymentDay: 'Friday',
    referenceDate: '2026-05-15',
    scheduleWeeks,
  });
  results.push({
    name: 'rejects-overpayment',
    passed: Boolean(overError?.includes('Overpayment')),
    detail: overError ?? 'no error',
  });

  const wrongDayError = validatePaymentSubmission({
    amountPesewas: 5000,
    weeklyPaymentPesewas,
    paymentDay: 'Monday',
    referenceDate: '2026-05-15',
    scheduleWeeks,
  });
  results.push({
    name: 'rejects-wrong-payment-day',
    passed: Boolean(wrongDayError?.includes('payment day')),
    detail: wrongDayError ?? 'no error',
  });

  const allocation = applyPaymentToSchedule(scheduleWeeks, '2026-05-15');
  results.push({
    name: 'oldest-obligation-first',
    passed: allocation.weekNumber === 1,
    detail: `allocated week ${allocation.weekNumber ?? 'none'}`,
  });

  return results;
}

export function runLifecycleChecks(): VerificationResult[] {
  const results: VerificationResult[] = [];

  const validTransitions: Array<[string, string]> = [
    [LOAN_LIFECYCLE.PENDING_DISBURSEMENT, LOAN_LIFECYCLE.DISBURSED],
    [LOAN_LIFECYCLE.DISBURSED, LOAN_LIFECYCLE.ACTIVE],
    [LOAN_LIFECYCLE.ACTIVE, LOAN_LIFECYCLE.COMPLETED],
  ];

  for (const [from, to] of validTransitions) {
    try {
      assertLifecycleTransition(from as never, to as never);
      results.push({ name: `valid-${from}-${to}`, passed: true, detail: 'ok' });
    } catch {
      results.push({ name: `valid-${from}-${to}`, passed: false, detail: 'unexpected rejection' });
    }
  }

  let rejected = false;
  try {
    assertLifecycleTransition(LOAN_LIFECYCLE.COMPLETED, LOAN_LIFECYCLE.ACTIVE);
  } catch {
    rejected = true;
  }
  results.push({
    name: 'rejects-completed-to-active',
    passed: rejected,
    detail: rejected ? 'rejected as expected' : 'allowed incorrectly',
  });

  return results;
}

export function runReversalBalanceChecks(): VerificationResult[] {
  const results: VerificationResult[] = [];

  const activeEffect = computePaymentReversalBalance(10000, 5000, LOAN_LIFECYCLE.ACTIVE);
  results.push({
    name: 'reversal-balance-active-credit',
    passed:
      activeEffect.beforeBalancePesewas === 10000 &&
      activeEffect.afterBalancePesewas === 15000 &&
      activeEffect.deltaPesewas === 5000 &&
      activeEffect.lifecycleStatus === LOAN_LIFECYCLE.ACTIVE,
    detail: `after=${activeEffect.afterBalancePesewas}`,
  });

  const completedEffect = computePaymentReversalBalance(0, 5000, LOAN_LIFECYCLE.COMPLETED);
  results.push({
    name: 'reversal-balance-completed-reactivates',
    passed:
      completedEffect.afterBalancePesewas === 5000 &&
      completedEffect.lifecycleStatus === LOAN_LIFECYCLE.ACTIVE,
    detail: `lifecycle=${completedEffect.lifecycleStatus}`,
  });

  assertLifecycleTransition(LOAN_LIFECYCLE.COMPLETED, LOAN_LIFECYCLE.ACTIVE);
  results.push({
    name: 'reversal-lifecycle-transition-valid',
    passed: true,
    detail: 'COMPLETED → ACTIVE allowed',
  });

  return results;
}

export function summarizeResults(results: VerificationResult[]): {
  passed: number;
  failed: number;
  results: VerificationResult[];
} {
  const passed = results.filter((entry) => entry.passed).length;
  return { passed, failed: results.length - passed, results };
}
