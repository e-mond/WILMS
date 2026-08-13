# Email Template Library

**Product version:** 1.8.0  
**Language:** British English  
**Source:** `packages/domain/src/infrastructure/notifications/templates.ts` and `email-layout.ts`

Borrower emails use the branded WILMS layout. Optional channels follow the trigger matrix; quiet hours and `emailNotificationsEnabled` still apply.

| Event | Builder | Subject pattern | Required content |
|-------|---------|-----------------|------------------|
| Registration submitted | `buildRegistrationSubmittedEmail` | Registration received | Application received; review pending |
| Registration approved | `buildRegistrationApprovedEmail` | Registration approved | Group and collector assignment |
| Loan created | Inline in `notifyLoanCreated` | WILMS loan application received | Application submitted for approval |
| Loan approved | `buildLoanApprovalEmail` | WILMS loan approved — {LoanId} | Amount + admin-fee instruction |
| Admin fee received | Inline in `notifyAdminFeeRecorded` | WILMS admin fee receipt — GHS {n} | Fee received; disbursement preparation |
| Loan disbursed | `buildLoanDisbursedEmail` | Disbursement confirmation | Amount and date |
| Schedule issued | Combined with disbursement email / SMS | — | Full schedule is sent by SMS; email confirms disbursement |
| Reminder (T−1) | `buildLoanReminderEmail` | Payment reminder | Amount and due date |
| Due today | **No email** | — | Channel matrix: SMS / in-app / push only |
| Missed payment | Staff/borrower email where configured | Missed payment | Amount and due date |
| Grace reminder | **No email** | — | Channel matrix: SMS / in-app / push only |
| Escalation | Staff in-app + borrower SMS; email where configured | Escalation | Follow-up required |
| Payment received | `buildPaymentConfirmationEmail` | WILMS payment receipt — GHS {n} | Amount, date, outstanding balance |
| Loan completed | `buildLoanFullyPaidEmail` | Loan fully paid | Account closed |
| Collector / group changed | Optional email via assignment dispatch | Assignment update | New collector or group |
| Payment day changed | `emitScheduleChangedNotification` | WILMS schedule update — {date} | New payment day and next due date |

Staff-only emails (invitations, login OTP, expense review, reconciliation) are documented in `documentation/books/NOTIFICATION_COMMUNICATION_BOOK.md` and are out of scope for this borrower lifecycle correction.
