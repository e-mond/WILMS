# Performance & Scale Report (v1.6.2)

- Borrower list cursor pagination retained
- New workflow tables indexed on borrower/loan/group/status
- Overdue ladder uses existing schedule week scans (no N+1 beyond pre-existing scheduler pattern)
- Frontend report panels are thin DataTable views; ops panel avoids heavy polling
