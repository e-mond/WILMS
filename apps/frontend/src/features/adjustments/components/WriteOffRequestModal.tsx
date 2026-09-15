'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useLoanPortfolio } from '@/features/loan-management/hooks/useLoanPortfolio';
import { useCreateAdjustment } from '@/features/adjustments/hooks/useCreateAdjustment';
import { createAdjustmentSchema } from '@/features/adjustments/adjustment.schema';
import { ADJUSTMENT_TYPE } from '@/types/adjustment';
import { LOAN_STATUS } from '@/types/loan';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';

export interface WriteOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WriteOffRequestModal({ isOpen, onClose }: WriteOffRequestModalProps) {
  const createAdjustment = useCreateAdjustment();
  const portfolioQuery = useLoanPortfolio();
  const [borrowerId, setBorrowerId] = useState('');
  const [loanId, setLoanId] = useState('');
  const [amountGhs, setAmountGhs] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const writeOffCandidates = useMemo(() => {
    const entries = portfolioQuery.data ?? [];
    return entries.filter(
      (entry) =>
        entry.status === LOAN_STATUS.ACTIVE ||
        entry.status === LOAN_STATUS.DEFAULTED ||
        (entry.outstandingPesewas ?? 0) > 0,
    );
  }, [portfolioQuery.data]);

  const borrowerOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const entry of writeOffCandidates) {
      if (!byId.has(entry.borrowerId)) {
        byId.set(entry.borrowerId, {
          id: entry.borrowerId,
          name: entry.borrowerName,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [writeOffCandidates]);

  const loansForBorrower = useMemo(
    () => writeOffCandidates.filter((entry) => entry.borrowerId === borrowerId),
    [borrowerId, writeOffCandidates],
  );

  const selectedLoan = useMemo(
    () => loansForBorrower.find((entry) => entry.id === loanId) ?? null,
    [loanId, loansForBorrower],
  );

  function resetForm() {
    setBorrowerId('');
    setLoanId('');
    setAmountGhs('');
    setReason('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleBorrowerChange(nextBorrowerId: string) {
    setBorrowerId(nextBorrowerId);
    setLoanId('');
    setAmountGhs('');
    setError(null);

    const loans = writeOffCandidates.filter((entry) => entry.borrowerId === nextBorrowerId);
    if (loans.length === 1) {
      const onlyLoan = loans[0]!;
      setLoanId(onlyLoan.id);
      setAmountGhs((onlyLoan.outstandingPesewas / 100).toFixed(2));
    }
  }

  function handleLoanChange(nextLoanId: string) {
    setLoanId(nextLoanId);
    setError(null);
    const loan = writeOffCandidates.find((entry) => entry.id === nextLoanId);
    if (loan) {
      setAmountGhs((loan.outstandingPesewas / 100).toFixed(2));
    }
  }

  async function handleSubmit() {
    setError(null);

    const amountValue = Number(amountGhs);
    if (!borrowerId || !loanId || !selectedLoan) {
      setError('Select a borrower and loan.');
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError('Enter a valid write-off amount in GHS.');
      return;
    }

    const parsed = createAdjustmentSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'A reason is required.');
      return;
    }

    const amountPesewas = Math.round(amountValue * 100);

    try {
      await createAdjustment.mutateAsync({
        type: ADJUSTMENT_TYPE.WRITE_OFF,
        loanId,
        borrowerId,
        borrowerName: selectedLoan.borrowerName,
        amountPesewas,
        reason: parsed.data.reason,
      });
      handleClose();
    } catch {
      // useCreateAdjustment already toasts errors
    }
  }

  const optionsLoading = portfolioQuery.isLoading;
  const optionsError = portfolioQuery.isError;
  const noCandidates = !optionsLoading && !optionsError && borrowerOptions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request write-off"
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={createAdjustment.isPending || optionsLoading || noCandidates}
            onClick={() => void handleSubmit()}
          >
            {createAdjustment.isPending ? 'Submitting…' : 'Submit write-off'}
          </Button>
        </>
      }
    >
      <p className="text-body text-text-muted">
        Submit a write-off for Super Admin approval. Approved write-offs also blacklist the borrower.
      </p>
      <div className="mt-wilms-3 space-y-wilms-3">
        {optionsLoading ? (
          <p className="text-small text-text-muted">Loading borrowers and loans…</p>
        ) : null}
        {optionsError ? (
          <p className="text-small text-danger" role="alert">
            Unable to load loans.{' '}
            <button
              type="button"
              className="font-semibold text-brand-primary hover:underline"
              onClick={() => void portfolioQuery.refetch()}
            >
              Retry
            </button>
          </p>
        ) : null}
        {noCandidates ? (
          <p className="text-small text-text-muted">No loans with outstanding balance available.</p>
        ) : null}

        <div>
          <label htmlFor="write-off-borrower" className="mb-1 block text-small text-text-muted">
            Borrower
          </label>
          <Select
            id="write-off-borrower"
            aria-label="Borrower"
            value={borrowerId}
            disabled={optionsLoading || noCandidates}
            onChange={(event) => handleBorrowerChange(event.target.value)}
          >
            <option value="">Select borrower</option>
            {borrowerOptions.map((borrower) => (
              <option key={borrower.id} value={borrower.id}>
                {borrower.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="write-off-loan" className="mb-1 block text-small text-text-muted">
            Loan
          </label>
          <Select
            id="write-off-loan"
            aria-label="Loan"
            value={loanId}
            disabled={!borrowerId || loansForBorrower.length === 0}
            onChange={(event) => handleLoanChange(event.target.value)}
          >
            <option value="">Select loan</option>
            {loansForBorrower.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {resolveLoanDisplayId(loan)} · GHS {(loan.outstandingPesewas / 100).toFixed(2)} outstanding
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="write-off-amount" className="mb-1 block text-small text-text-muted">
            Amount (GHS)
          </label>
          <Input
            id="write-off-amount"
            aria-label="Amount in GHS"
            placeholder="Amount (GHS)"
            inputMode="decimal"
            value={amountGhs}
            onChange={(event) => setAmountGhs(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="write-off-reason" className="mb-1 block text-small text-text-muted">
            Reason
          </label>
          <Textarea
            id="write-off-reason"
            aria-label="Write-off reason"
            placeholder="Reason for write-off..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        {error ? (
          <p className="text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
