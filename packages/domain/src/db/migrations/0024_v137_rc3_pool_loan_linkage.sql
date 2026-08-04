-- v1.3.7-rc3: Link existing loans to pools via borrower group membership.
UPDATE loans AS l
SET loan_pool_id = pm.pool_id
FROM borrowers AS b
INNER JOIN pool_memberships AS pm ON pm.group_id = b.group_id
WHERE l.borrower_id = b.id
  AND l.loan_pool_id IS NULL
  AND b.group_id IS NOT NULL
  AND l.deleted_at IS NULL;
