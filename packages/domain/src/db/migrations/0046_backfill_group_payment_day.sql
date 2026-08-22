-- Backfill collection day from active member loans where groups were created before payment_day was required.
UPDATE groups AS g
SET payment_day = sub.payment_day
FROM (
  SELECT
    gm.group_id,
    MODE() WITHIN GROUP (ORDER BY l.payment_day) AS payment_day
  FROM group_members gm
  INNER JOIN loans l ON l.borrower_id = gm.borrower_id AND l.external_status = 'ACTIVE'
  GROUP BY gm.group_id
) AS sub
WHERE g.id = sub.group_id
  AND g.payment_day IS NULL;
