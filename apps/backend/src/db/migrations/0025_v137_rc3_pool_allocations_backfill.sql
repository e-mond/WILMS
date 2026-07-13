-- v1.3.7-rc3: Backfill pool allocation rows from existing loans/payments and refresh aggregates.

INSERT INTO pool_allocations (
  id,
  pool_id,
  allocation_type,
  amount_pesewas,
  loan_id,
  borrower_id,
  description,
  recorded_at
)
SELECT
  gen_random_uuid(),
  l.loan_pool_id,
  'DISBURSEMENT',
  ROUND(COALESCE(NULLIF(l.disbursed_amount, 0), l.principal_amount) * 100)::int,
  l.id,
  l.borrower_id,
  'Backfill disbursement for loan ' || right(l.id::text, 8),
  COALESCE(ld.disbursed_at, l.updated_at, l.created_at)
FROM loans AS l
LEFT JOIN LATERAL (
  SELECT disbursed_at
  FROM loan_disbursements
  WHERE loan_id = l.id
  ORDER BY disbursed_at ASC
  LIMIT 1
) AS ld ON TRUE
WHERE l.loan_pool_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM loan_pools AS lp WHERE lp.id = l.loan_pool_id)
  AND l.external_status <> 'PENDING_DISBURSEMENT'
  AND l.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM pool_allocations AS pa
    WHERE pa.pool_id = l.loan_pool_id
      AND pa.loan_id = l.id
      AND pa.allocation_type = 'DISBURSEMENT'
  );

INSERT INTO pool_allocations (
  id,
  pool_id,
  allocation_type,
  amount_pesewas,
  loan_id,
  borrower_id,
  payment_id,
  description,
  recorded_at
)
SELECT
  gen_random_uuid(),
  l.loan_pool_id,
  'REPAYMENT',
  p.amount_pesewas,
  l.id,
  p.borrower_id,
  p.id,
  'Backfill repayment for payment ' || right(p.id::text, 8),
  p.recorded_at
FROM payments AS p
INNER JOIN loans AS l ON l.id = p.loan_id
WHERE l.loan_pool_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM loan_pools AS lp WHERE lp.id = l.loan_pool_id)
  AND p.status = 'CONFIRMED'
  AND NOT EXISTS (
    SELECT 1
    FROM pool_allocations AS pa
    WHERE pa.payment_id = p.id
      AND pa.allocation_type = 'REPAYMENT'
  );

WITH pool_totals AS (
  SELECT
    pool_id,
    COALESCE(SUM(CASE WHEN allocation_type = 'DISBURSEMENT' THEN amount_pesewas ELSE 0 END), 0)::int AS disbursed_pesewas,
    COALESCE(SUM(CASE WHEN allocation_type = 'REPAYMENT' THEN amount_pesewas ELSE 0 END), 0)::int AS collected_pesewas
  FROM pool_allocations
  GROUP BY pool_id
)
UPDATE loan_pools AS lp
SET
  disbursed_pesewas = pt.disbursed_pesewas,
  collected_pesewas = pt.collected_pesewas,
  outstanding_pesewas = GREATEST(pt.disbursed_pesewas - pt.collected_pesewas, 0),
  utilisation_percent = CASE
    WHEN lp.capital_pesewas > 0 THEN LEAST(ROUND(pt.disbursed_pesewas::numeric / lp.capital_pesewas * 100), 100)::int
    ELSE 0
  END,
  repayment_rate_percent = CASE
    WHEN pt.disbursed_pesewas > 0 THEN ROUND(pt.collected_pesewas::numeric / pt.disbursed_pesewas * 1000) / 10
    ELSE 0
  END,
  status = CASE
    WHEN lp.capital_pesewas > 0 AND ROUND(pt.disbursed_pesewas::numeric / lp.capital_pesewas * 100) >= 95 THEN 'NEAR_FULL'
    WHEN lp.capital_pesewas > 0 AND ROUND(pt.disbursed_pesewas::numeric / lp.capital_pesewas * 100) < 20 THEN 'LAUNCHING'
    ELSE 'ACTIVE'
  END,
  updated_at = NOW()
FROM pool_totals AS pt
WHERE lp.id = pt.pool_id;

-- Balanced reconciliations should not remain in manual review.
UPDATE financial_reconciliations
SET status = 'APPROVED'
WHERE variance_flagged = FALSE
  AND status IN ('SUBMITTED', 'PENDING_REVIEW');
