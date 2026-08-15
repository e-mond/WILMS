# Guarantor notification policy

SMS is mandatory for guarantors when a phone number is stored on the borrower profile. Events reuse `GUARANTOR_ALERT`. Duplicate prevention relies on existing notification delivery logging.

| Event | Trigger | Borrower SMS? | Guarantor SMS |
| --- | --- | --- | --- |
| Loan approved | `approveLoan` | Yes (existing) | Mandated copy |
| Loan fully repaid | `notifyLoanFullyPaid` | Yes | Mandated copy |
| More than two missed periods | Payment scheduler missed-week count > 2 | Yes (existing missed/grace ladder) | Mandated copy |

Quiet hours apply to staff preference channels. Borrower and guarantor operational SMS remain mandatory and are not suppressed by staff quiet-hour preferences.
