'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { FormField, MultiStepForm } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  LOAN_CYCLE_BATCH_SUGGESTIONS,
  LOAN_STEP_LABELS,
  PAYMENT_DAY_OPTIONS,
} from '@/constants/loan';
import { PERMISSION } from '@/constants/permissions';
import { LoanPreview } from '@/features/loan-management/components/LoanPreview';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';
import { useEligibleBorrowers } from '@/features/loan-management/hooks/useEligibleBorrowers';
import {
  createLoanSchema,
  LOAN_STEP_FIELD_NAMES,
  LOAN_STEP_SCHEMAS,
} from '@/features/loan-management/loan.schema';
import {
  DEFAULT_LOAN_FORM_VALUES,
  toCreateLoanInput,
} from '@/features/loan-management/loan.utils';
import { loanService } from '@/services';
import type { CreateLoanFormValues } from '@/types/loan';
import { ApiError } from '@/types/api';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';

const LOAN_STEPS = LOAN_STEP_LABELS.map((title, index) => ({
  id: `loan-step-${index + 1}`,
  title,
}));

function stepIndexForField(field: string): number {
  if (field === 'borrowerId') {
    return 0;
  }

  if (field === 'amountGhs' || field === 'durationWeeks') {
    return 1;
  }

  if (field === 'paymentDay' || field === 'cycleBatch' || field === 'startDate') {
    return 2;
  }

  return 3;
}

function applySchemaErrors(
  issues: { path: (string | number)[]; message: string }[],
  setError: ReturnType<typeof useForm<CreateLoanFormValues>>['setError'],
) {
  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === 'string') {
      setError(field as keyof CreateLoanFormValues, {
        type: 'manual',
        message: issue.message,
      });
    }
  }
}

export function CreateLoanWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: eligibleBorrowers, isLoading, isError, error, refetch } = useEligibleBorrowers();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLoanFormValues>({
    defaultValues: DEFAULT_LOAN_FORM_VALUES,
    mode: 'onBlur',
  });

  const formValues = watch();
  const selectedBorrower = useMemo(
    () => eligibleBorrowers?.find((borrower) => borrower.id === formValues.borrowerId),
    [eligibleBorrowers, formValues.borrowerId],
  );

  const createLoanMutation = useMutation({
    mutationFn: (input: ReturnType<typeof toCreateLoanInput>) => {
      if (!input) {
        throw new Error('Invalid loan details.');
      }

      return loanService.createLoan(input);
    },
    onSuccess: async (loan) => {
      setCreatedLoanId(loan.id);
      const loanLabel = resolveLoanDisplayId(loan);
      notifyMutationSuccess('Loan created', `Loan ${loanLabel} is ready for disbursement.`);
      await queryClient.invalidateQueries({ queryKey: ['loans'] });
      await queryClient.invalidateQueries({ queryKey: ['loans', 'portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['loans', loan.id] });
      await queryClient.invalidateQueries({ queryKey: ['loans', loan.id, 'schedule'] });
      await queryClient.invalidateQueries({ queryKey: ['borrowers', 'loan-eligible'] });
    },
  });

  const validateCurrentStep = async () => {
    clearErrors();
    const stepSchema = LOAN_STEP_SCHEMAS[currentStep];
    const parsed = stepSchema.safeParse(getValues());

    if (!parsed.success) {
      applySchemaErrors(parsed.error.issues, setError);
      await trigger(LOAN_STEP_FIELD_NAMES[currentStep] as (keyof CreateLoanFormValues)[]);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (isValid) {
      setCurrentStep((step) => Math.min(step + 1, LOAN_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const parsed = createLoanSchema.safeParse(values);

    if (!parsed.success) {
      applySchemaErrors(parsed.error.issues, setError);
      const firstIssue = parsed.error.issues[0];
      const firstField = firstIssue?.path[0];

      if (typeof firstField === 'string') {
        setCurrentStep(stepIndexForField(firstField));
      }

      setSubmitError(firstIssue?.message ?? 'Please review all loan details before submitting.');
      return;
    }

    const payload = toCreateLoanInput(parsed.data);

    if (!payload) {
      setSubmitError('Enter a valid loan amount in GHS.');
      return;
    }

    try {
      await createLoanMutation.mutateAsync(payload);
    } catch (error) {
      notifyMutationError('Loan creation failed', error, 'Unable to create this loan.');
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Unable to create this loan. Please try again.',
      );
    }
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading eligible borrowers" className="py-wilms-8" />;
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Unable to load borrowers"
      />
    );
  }

  if (!eligibleBorrowers?.length) {
    return (
      <GuidedEmptyState
        {...EMPTY_STATE_COPY.loans}
        title="No borrowers ready for loans"
        description="Borrowers must be approved, have a recorded admin fee, and no existing open loan."
        action={
          <Button type="button" variant="secondary" onClick={() => router.push('/loans')}>
            Back to loans
          </Button>
        }
      />
    );
  }

  if (createdLoanId) {
    return (
      <EmptyState
        title="Loan created"
        description="The weekly schedule has been generated. The loan is pending disbursement."
        action={
          <div className="flex flex-wrap justify-center gap-wilms-3">
            <Link
              href={`/loans/${createdLoanId}`}
              className="inline-flex h-10 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-4 text-body font-semibold text-card hover:opacity-90"
            >
              View schedule
            </Link>
            <Button type="button" variant="secondary" onClick={() => router.push('/loans')}>
              Back to loans
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <MultiStepForm
      steps={LOAN_STEPS}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={() => void handleNext()}
      onSubmit={() => void onSubmit()}
      isSubmitting={isSubmitting || createLoanMutation.isPending}
      submitLabel="Create loan"
      submitPermissions={[PERMISSION.APPROVE_LOANS]}
    >
      {submitError ? (
        <Alert title="Loan creation failed" variant="error">
          {submitError}
        </Alert>
      ) : null}

      {currentStep === 0 ? (
        <section>
          <FormField
            label="Borrower"
            htmlFor="borrowerId"
            required
            error={errors.borrowerId?.message}
          >
            <Select
              id="borrowerId"
              hasError={Boolean(errors.borrowerId)}
              {...register('borrowerId')}
            >
              <option value="">Select borrower</option>
              {eligibleBorrowers.map((borrower) => (
                <option key={borrower.id} value={borrower.id}>
                  {borrower.fullName} — {borrower.community}
                </option>
              ))}
            </Select>
          </FormField>
        </section>
      ) : null}

      {currentStep === 1 ? (
        <section className="grid gap-wilms-4 md:grid-cols-2">
          <FormField
            label="Loan amount (GHS)"
            htmlFor="amountGhs"
            required
            error={errors.amountGhs?.message}
          >
            <Input
              id="amountGhs"
              inputMode="decimal"
              placeholder="e.g. 300.00"
              hasError={Boolean(errors.amountGhs)}
              {...register('amountGhs')}
            />
          </FormField>
          <FormField
            label="Duration (weeks)"
            htmlFor="durationWeeks"
            required
            error={errors.durationWeeks?.message}
          >
            <Input
              id="durationWeeks"
              type="number"
              min={1}
              max={52}
              hasError={Boolean(errors.durationWeeks)}
              {...register('durationWeeks', { valueAsNumber: true })}
            />
          </FormField>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="grid gap-wilms-4 md:grid-cols-2">
          <FormField
            label="Payment day"
            htmlFor="paymentDay"
            required
            error={errors.paymentDay?.message}
          >
            <Select
              id="paymentDay"
              hasError={Boolean(errors.paymentDay)}
              {...register('paymentDay')}
            >
              <option value="">Select payment day</option>
              {PAYMENT_DAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Cycle / batch"
            htmlFor="cycleBatch"
            required
            error={errors.cycleBatch?.message}
          >
            <Input
              id="cycleBatch"
              list="cycle-batch-suggestions"
              placeholder="e.g. Cycle 5 — January 2027"
              hasError={Boolean(errors.cycleBatch)}
              {...register('cycleBatch')}
            />
            <datalist id="cycle-batch-suggestions">
              {LOAN_CYCLE_BATCH_SUGGESTIONS.map((cycle) => (
                <option key={cycle} value={cycle} />
              ))}
            </datalist>
          </FormField>
          <FormField
            label="Start date"
            htmlFor="startDate"
            required
            error={errors.startDate?.message}
            className="md:col-span-2"
          >
            <Input
              id="startDate"
              type="date"
              hasError={Boolean(errors.startDate)}
              {...register('startDate')}
            />
          </FormField>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <LoanPreview values={formValues} borrower={selectedBorrower} />
      ) : null}
    </MultiStepForm>
  );
}
