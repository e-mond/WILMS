import type {
  OverpaymentReview,
  OverpaymentReviewListResponse,
  QueueOverpaymentReviewInput,
} from '@/types/overpayment-review';
import type { IOverpaymentReviewService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const overpaymentReviewService: IOverpaymentReviewService = {
  listPendingReviews(): Promise<OverpaymentReviewListResponse> {
    return apiClient.get<OverpaymentReviewListResponse>('/overpayment-reviews/pending');
  },

  queueReview(input: QueueOverpaymentReviewInput): Promise<OverpaymentReview> {
    return apiClient.post<OverpaymentReview>('/overpayment-reviews', input);
  },

  resolveReview(id, input, actorId, actorDisplayName): Promise<OverpaymentReview> {
    return apiClient.post<OverpaymentReview>(`/overpayment-reviews/${id}/resolve`, {
      ...input,
      actorId,
      actorDisplayName,
    });
  },
};

export default overpaymentReviewService;
