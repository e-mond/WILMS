import type { ReconciliationSubmission } from '@/types/reconciliation';

const submissions = new Map<string, ReconciliationSubmission>();

function submissionKey(collectorId: string, date: string): string {
  return `${collectorId}:${date}`;
}

export function getReconciliationSubmission(
  collectorId: string,
  date: string,
): ReconciliationSubmission | undefined {
  return submissions.get(submissionKey(collectorId, date));
}

export function saveReconciliationSubmission(submission: ReconciliationSubmission): void {
  submissions.set(submissionKey(submission.collectorId, submission.date), submission);
}

export function resetReconciliationSubmissions(): void {
  submissions.clear();
}
