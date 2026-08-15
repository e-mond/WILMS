# Borrower SMS lifecycle — v1.8.0 correction

| # | Event | When | Borrower notified? |
| --- | --- | --- | --- |
| 1 | Registration submitted | Officer submits | Yes |
| — | Group/collector assigned during review | Approver assigns while PENDING | **No** (staff in-app only) |
| 2 | Registration approved | Approver approves | Yes, including group and collector when known |
| 3 | Registration rejected / blacklisted / escalated | Decision | Yes (escalation keeps PENDING) |
| 4 | Loan created | Loan insert | Yes |
| 5 | Loan approved | Lifecycle APPROVED | Yes, admin fee from settings |
| 6 | Admin fee received | Fee payment recorded | Yes |
| 7 | Loan disbursed | Disbursement | Yes + repayment schedule SMS |
| 8 | Reminder / due / received / multi-week / missed / grace / escalation / completion | Scheduler and payments | Existing templates |

Group assignment SMS after approval is treated as **reassignment** (`buildGroupAssignedSmsBody`), not a second congratulations message.
