-- Backfill stale reconciliation expected snapshots for open review rows.
-- Prefer schedule installments due on the reconciliation date for the collector portfolio.
UPDATE financial_reconciliations AS fr
SET
  expected_due_pesewas = computed.expected_pesewas,
  primary_variance_pesewas = fr.physical_cash_pesewas - computed.expected_pesewas,
  variance_class = (
    CASE
      WHEN fr.physical_cash_pesewas - computed.expected_pesewas = 0 THEN 'BALANCED'
      WHEN fr.physical_cash_pesewas - computed.expected_pesewas < 0 THEN 'SHORTAGE'
      ELSE 'OVERAGE'
    END
  )::reconciliation_variance_class
FROM (
  SELECT
    fr2.id AS reconciliation_id,
    COALESCE((
      SELECT SUM(ROUND(ls.installment_amount::numeric * 100))::int
      FROM groups g
      INNER JOIN group_members gm
        ON gm.group_id = g.id
        AND gm.removed_at IS NULL
      INNER JOIN loans l
        ON l.borrower_id = gm.borrower_id
        AND l.deleted_at IS NULL
        AND l.external_status = 'ACTIVE'
      INNER JOIN loan_schedules ls
        ON ls.loan_id = l.id
        AND ls.due_date = fr2.reconciliation_date
      WHERE g.collector_user_id = fr2.collector_user_id
        AND g.deleted_at IS NULL
    ), 0) AS expected_pesewas
  FROM financial_reconciliations fr2
  WHERE fr2.status IN (
      'SUBMITTED',
      'PENDING_REVIEW',
      'UNDER_INVESTIGATION',
      'REOPENED',
      'REJECTED'
    )
    AND fr2.expected_due_pesewas = 0
) AS computed
WHERE fr.id = computed.reconciliation_id
  AND computed.expected_pesewas > 0;
