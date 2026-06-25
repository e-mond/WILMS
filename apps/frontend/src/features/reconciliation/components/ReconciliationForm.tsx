'use client';

import { useMemo, useState } from 'react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms';
import { Input } from '@/components/ui/Input';
import { RECONCILIATION_VARIANCE_THRESHOLD_PERCENT } from '@/constants/reconciliation';
import { useReconciliation } from '@/features/reconciliation/hooks/useReconciliation';
import { useSubmitReconciliation } from '@/features/reconciliation/hooks/useSubmitReconciliation';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/types/api';
import {
  calculatePrimaryVariancePesewas,
  isVarianceAboveThreshold,
} from '@/utils/reconciliation-summary';
import {
  flaggedCommentSchema,
  ghsInputToPesewas,
  reconciliationFormSchema,
} from '@/utils/reconciliation.schema';
import { RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH } from '@/constants/reconciliation';
import { formatDisplayDate } from '@/utils/format-date';

function defaultReconciliationDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReconciliationForm() {
  const { user } = useAuth();
  const [date, setDate] = useState(defaultReconciliationDate);
  const [physicalCashGhs, setPhysicalCashGhs] = useState('');
  const [comment, setComment] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, isLoading, isError } = useReconciliation(user?.id, date);
  const submitMutation = useSubmitReconciliation(user?.id ?? '', date);

  const previewVariancePesewas = useMemo(() => {
    if (!data || !physicalCashGhs.trim()) {
      return null;
    }

    const parsed = reconciliationFormSchema.safeParse({ physicalCashGhs });

    if (!parsed.success) {
      return null;
    }

    return calculatePrimaryVariancePesewas(
      ghsInputToPesewas(parsed.data.physicalCashGhs),
      data.expectedPesewas,
    );
  }, [data, physicalCashGhs]);

  const previewVarianceFlagged = useMemo(() => {
    if (!data || previewVariancePesewas === null) {
      return false;
    }

    return isVarianceAboveThreshold(previewVariancePesewas, data.expectedPesewas);
  }, [data, previewVariancePesewas]);

  if (!user?.id) {
    return (
      <EmptyState
        title="Sign in required"
        description="Collector credentials are required to submit reconciliation."
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading reconciliation summary" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Unable to load reconciliation"
        description="Check your connection and try again."
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (data.submitted) {
      return;
    }

    const parsed = reconciliationFormSchema.safeParse({ physicalCashGhs });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid physical cash amount');
      return;
    }

    setFieldError(null);
    setCommentError(null);
    setActionError(null);
    setSuccessMessage(null);

    const commentValidation = flaggedCommentSchema(previewVarianceFlagged).safeParse(comment);
    if (!commentValidation.success) {
      setCommentError(
        commentValidation.error.issues[0]?.message ??
          `A comment of at least ${RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH} characters is required when variance is flagged.`,
      );
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        collectorId: user.id,
        date,
        physicalCashPesewas: ghsInputToPesewas(parsed.data.physicalCashGhs),
        comment: previewVarianceFlagged ? comment.trim() : undefined,
      });

      if (result.varianceFlagged) {
        setSuccessMessage(
          'Reconciliation submitted. Variance exceeds threshold — Super Admin has been notified.',
        );
      } else if (result.variancePesewas === 0) {
        setSuccessMessage('Reconciliation submitted. Physical cash matches expected collections.');
      } else {
        setSuccessMessage('Reconciliation submitted and locked for this date.');
      }
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : 'Unable to submit reconciliation. Try again.',
      );
    }
  };

  return (
    <div className="space-y-wilms-6">
      <div className="flex flex-wrap items-end gap-wilms-3">
        <FormField label="Reconciliation date" htmlFor="reconciliation-date">
          <Input
            id="reconciliation-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSuccessMessage(null);
              setActionError(null);
              setComment('');
              setCommentError(null);
            }}
            disabled={data.submitted}
          />
        </FormField>
        <p className="text-body text-text-muted">{formatDisplayDate(date)}</p>
      </div>

      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Expected collections"
          value={<CurrencyAmount value={data.expectedPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Collected (system)"
          value={<CurrencyAmount value={data.actualPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Physical cash"
          value={
            data.submitted && data.physicalCashPesewas !== undefined ? (
              <CurrencyAmount value={data.physicalCashPesewas} />
            ) : (
              '—'
            )
          }
        />
        <KpiCard
          variant="executive"
          label="Variance"
          value={
            data.submitted ? (
              <CurrencyAmount value={data.variancePesewas} />
            ) : previewVariancePesewas !== null ? (
              <CurrencyAmount value={previewVariancePesewas} />
            ) : (
              '—'
            )
          }
        />
      </ExecutiveKpiGrid>

      {data.submitted ? (
        <Alert
          title="Reconciliation locked"
          variant={data.varianceFlagged ? 'warning' : data.variancePesewas === 0 ? 'success' : 'info'}
        >
          Reconciliation submitted for {formatDisplayDate(date)} and is locked.{' '}
          {data.varianceFlagged
            ? 'Variance exceeds the review threshold — Super Admin has been notified.'
            : data.variancePesewas === 0
              ? 'Physical cash matches expected collections.'
              : 'Minor variance recorded.'}
        </Alert>
      ) : null}

      {!data.submitted && previewVarianceFlagged ? (
        <Alert title="Variance review required" variant="warning">
          Variance exceeds {RECONCILIATION_VARIANCE_THRESHOLD_PERCENT}% of expected collections.
          Submitting will alert Super Admin for review.
        </Alert>
      ) : null}

      {!data.submitted && previewVariancePesewas === 0 && physicalCashGhs.trim() ? (
        <Alert title="Cash matches expected" variant="success">
          Physical cash matches expected collections for this date.
        </Alert>
      ) : null}

      {actionError ? (
        <Alert title="Submission failed" variant="error">
          {actionError}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert title="Reconciliation submitted" variant="success">
          {successMessage}
        </Alert>
      ) : null}

      {!data.submitted ? (
        <form className="max-w-md space-y-wilms-4" onSubmit={handleSubmit}>
          <FormField
            label="Physical cash counted (GHS)"
            htmlFor="physical-cash"
            error={fieldError ?? undefined}
          >
            <Input
              id="physical-cash"
              inputMode="decimal"
              placeholder="0.00"
              value={physicalCashGhs}
              onChange={(event) => setPhysicalCashGhs(event.target.value)}
            />
          </FormField>
          <p className="text-small text-text-muted">
            Enter the total cash you physically hold at end of day.
          </p>

          {previewVarianceFlagged ? (
            <>
              <FormField
                label="Variance explanation (required)"
                htmlFor="reconciliation-comment"
                error={commentError ?? undefined}
                required
              >
                <textarea
                  id="reconciliation-comment"
                  className="min-h-[96px] w-full rounded-wilms-md border border-border bg-surface px-wilms-3 py-wilms-2 text-body text-text-primary"
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value);
                    setCommentError(null);
                  }}
                  placeholder="Explain the variance for supervisor review"
                />
              </FormField>
              <p className="text-small text-text-muted">
                Minimum {RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH} characters when variance exceeds{' '}
                {RECONCILIATION_VARIANCE_THRESHOLD_PERCENT}%.
              </p>
            </>
          ) : null}

          <PermissionGate permission={PERMISSION.RECORD_COLLECTIONS}>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting…' : 'Submit reconciliation'}
            </Button>
          </PermissionGate>
        </form>
      ) : null}
    </div>
  );
}
