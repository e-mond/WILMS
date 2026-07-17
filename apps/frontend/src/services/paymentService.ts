import { captureGps } from '@/utils/captureGps';
import { apiClient } from '@/utils/apiClient';
import type { IPaymentService } from '@/types/services';
import type { PaymentEntryContext } from '@/types/payment-entry';
import type { EditPaymentInput, PaymentTransaction, RecordPaymentInput } from '@/types/payment';

const paymentService: IPaymentService = {
  getPaymentEntryContext(borrowerId: string, referenceDate?: string): Promise<PaymentEntryContext> {
    const query = referenceDate ? `?date=${encodeURIComponent(referenceDate)}` : '';
    return apiClient.get<PaymentEntryContext>(`/borrowers/${borrowerId}/payment-entry${query}`);
  },

  getSameDayPayment(
    borrowerId: string,
    collectorId: string,
    referenceDate?: string,
  ): Promise<PaymentTransaction | null> {
    const query = new URLSearchParams({
      borrowerId,
      collectorId,
      ...(referenceDate ? { date: referenceDate } : {}),
    });

    return apiClient.get<PaymentTransaction | null>(`/payments/same-day?${query.toString()}`);
  },

  getPayment(paymentId: string): Promise<PaymentTransaction> {
    return apiClient.get<PaymentTransaction>(`/payments/${paymentId}`);
  },

  async editPayment(_paymentId: string, _input: EditPaymentInput): Promise<PaymentTransaction> {
    // Posted payments are immutable on the API (PATCH returns 409).
    // Corrections require Super Admin reverse + re-record, or an adjustment request.
    const { ApiError, API_ERROR_CODE } = await import('@/types/api');
    throw new ApiError(
      'Posted payments cannot be edited. Reverse the payment or request a Super Admin adjustment.',
      API_ERROR_CODE.CONFLICT,
      409,
    );
  },

  async recordPayment(input: RecordPaymentInput): Promise<PaymentTransaction> {
    const gps = input.gps ?? (await captureGps());

    return apiClient.post<PaymentTransaction>('/payments', {
      borrowerId: input.borrowerId,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      collectorId: input.collectorId,
      gps,
    });
  },

  reversePayment(
    paymentId: string,
    input: { reason: string; actorId: string; actorDisplayName: string },
  ): Promise<PaymentTransaction> {
    return apiClient.post<PaymentTransaction>(`/payments/${paymentId}/reverse`, input);
  },
};

export default paymentService;
