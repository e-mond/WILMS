/**
 * P14.3B Phase 3C.2 — Certification payment target resolution.
 *
 * Delegates to the 3C.1 reversal harness so cert scripts share the same
 * eligibility rules (lifecycle, correction conflict, payable obligations).
 */
import { recordReversiblePayment } from './reversal-checks.js';

export interface CertPaymentTarget {
  paymentId: string;
  loanId: string;
  borrowerId: string;
  amountPesewas: number;
}

/**
 * Resolves a payment that can be reversed without PAYMENT_CORRECTION conflict.
 */
export async function resolveCertPaymentTarget(
  collectorId: string,
  _adminActorId: string,
  suffix: string,
  options: { preferExisting?: boolean } = {},
): Promise<CertPaymentTarget> {
  try {
    return await recordReversiblePayment(collectorId, suffix, {
      preferExisting: options.preferExisting,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'No confirmed payment or payable obligation available for reversal verification'
    ) {
      throw new Error(
        'No certification payment available — use a fresh Neon branch or reset transactional seed data',
      );
    }
    throw error;
  }
}
