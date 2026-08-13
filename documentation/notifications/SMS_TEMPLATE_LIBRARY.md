# SMS Template Library

**Product version:** 1.8.0  
**Language:** British English  
**Source:** `packages/domain/src/infrastructure/notifications/templates.ts`

Amounts are formatted as `GHS {n.nn}` from pesewas.

| # | Event | Builder | Body |
|---|-------|---------|------|
| 1 | Registration submitted | `buildRegistrationSubmittedSmsBody` | WILMS: Dear {BorrowerName}, we have received your loan registration application. Your application reference is {Reference}. An Approver will review it shortly. We will notify you once a decision has been made. |
| 2 | Registration approved | `buildBorrowerRegistrationApprovalSmsBody` | WILMS: Congratulations {BorrowerName}! Your registration has been approved. You have been assigned to {GroupName} under Collector {CollectorName}. The next step is the creation and approval of your interest-free loan. |
| 3 | Loan created | `buildLoanCreatedSmsBody` | WILMS: Dear {BorrowerName}, your loan application has been created and submitted for approval. We will notify you once the loan has been approved. |
| 4 | Loan approved | `buildLoanApprovalSmsBody` | WILMS: Congratulations {BorrowerName}! Your interest-free loan of GHS {LoanAmount} has been approved. To proceed to disbursement, please pay the required admin fee of GHS {AdminFeeAmount}. We will notify you immediately after your payment is confirmed. |
| 5 | Admin fee received | `buildAdminFeeConfirmationSmsBody` | WILMS: Dear {BorrowerName}, we have received your admin fee payment of GHS {AdminFeeAmount} on {PaymentDate}. Your loan is now being prepared for disbursement. We will notify you once the funds have been released. |
| 6 | Loan disbursed | `buildLoanDisbursedSmsBody` | WILMS: Dear {BorrowerName}, your interest-free loan of GHS {LoanAmount} has been successfully disbursed. Your first repayment is due on {FirstPaymentDate}. A detailed repayment schedule has been sent to you. |
| 7 | Schedule issued | `buildLoanDisbursedScheduleSmsBody` | WILMS: Repayment Schedule — Group: {GroupName} \| Collector: {CollectorName} \| Weekly payment: GHS {WeeklyAmount} \| Payment day: {PaymentDay} \| First payment: {FirstPaymentDate} \| Total weeks: {TotalWeeks}. Please make each payment on or before the due date. |
| 8 | Reminder (T−1) | `buildLoanReminderSmsBody` (`dueTomorrow: true`) | WILMS: Reminder — Dear {BorrowerName}, your weekly repayment of GHS {WeeklyAmount} is due tomorrow ({PaymentDay}, {PaymentDate}). Group: {GroupName}. Collector: {CollectorName}. Please ensure payment is made on time. |
| 9 | Due today | `buildLoanReminderSmsBody` (`dueTomorrow: false`) | WILMS: Dear {BorrowerName}, your repayment of GHS {WeeklyAmount} is due today ({PaymentDate}). Please make payment to your collector, {CollectorName}, today to keep your account in good standing. |
| 10 | Payment received | `buildPaymentConfirmationSmsBody` | WILMS: Thank you, {BorrowerName}. We have received your payment of GHS {PaymentAmount} on {PaymentDate}. Outstanding balance: GHS {RemainingBalance}. Remaining instalments: {RemainingWeeks}. Thank you for staying up to date with your repayments. |
| 11 | Multi-week payment | `buildMultiWeekPaymentSmsBody` | WILMS: Thank you, {BorrowerName}. We have received GHS {PaymentAmount}, covering {WeeksPaid} weekly repayments. Outstanding balance: GHS {RemainingBalance}. Remaining instalments: {RemainingWeeks}. |
| 12 | Missed payment | `buildMissedPaymentSmsBody` | WILMS: Dear {BorrowerName}, we did not receive your repayment of GHS {WeeklyAmount} due today ({PaymentDate}). Please make payment within the grace period to avoid escalation. If you have already paid, please contact your collector, {CollectorName}. |
| 13 | Grace reminder | `buildGracePeriodReminderSmsBody` | WILMS: Reminder — Your repayment of GHS {WeeklyAmount} remains outstanding. Your grace period ends on {GraceEndDate}. Please make payment immediately or contact your collector, {CollectorName}, if you need assistance. |
| 14 | Escalation | `buildEscalationNoticeSmsBody` | WILMS: Your repayment remains unpaid after the grace period. Your account has been flagged for follow-up by your group and collector. Please contact {CollectorName} immediately to avoid further action. |
| 15 | Loan completed | `buildLoanCompletedSmsBody` | WILMS: Congratulations {BorrowerName}! We have received your final repayment of GHS {PaymentAmount}. Your loan has been fully repaid and your account is now closed. Thank you for honouring your repayment commitments. |
| 16 | Collector reassigned | `buildCollectorReassignedSmsBody` | WILMS: Dear {BorrowerName}, your collector has been updated. Your new collector is {CollectorName}. Your group and repayment schedule remain unchanged unless separately notified. |
| 17 | Group reassigned | `buildGroupAssignedSmsBody` | WILMS: Dear {BorrowerName}, you have been reassigned to {GroupName} under Collector {CollectorName}. Your future repayments should be made through your new group and collector. |
| 18 | Payment day changed | `buildPaymentDayChangedSmsBody` | WILMS: Important — Your repayment schedule has changed. Your new weekly payment day is {PaymentDay}. Your next payment of GHS {WeeklyAmount} is due on {NextPaymentDate}. |

Registration-rejected, loan-rejected, and blacklist SMS remain operational staff/borrower notices and are unchanged in purpose.
