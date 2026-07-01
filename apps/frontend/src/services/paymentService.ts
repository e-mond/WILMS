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

  async editPayment(paymentId: string, input: EditPaymentInput): Promise<PaymentTransaction> {
    const gps = input.gps ?? (await captureGps());

    return apiClient.patch<PaymentTransaction>(`/payments/${paymentId}`, {
      collectorId: input.collectorId,
      reason: input.reason,
      gps,
    });
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
