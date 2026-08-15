# WILMS v1.8.1 hotfix — settings, notifications, records, GPS placeholder

**Branch:** `hotfix/v1.8.0-settings-notifications-borrower-records`  
**Version:** v1.8.1  
**Migrations:** none  
**GhanaPost GPS:** not included (planning only after this release)

## Completed

- Settings-backed group capacity and community formation queue
- Approver full-group warning and create-new-group path
- No borrower group SMS before registration approval
- Rejected / blacklisted / escalated SMS + staff in-app + audit
- Ghana Digital Address reverse geocode placeholder (no GhanaPost API)
- Collector profile live contact/activity + larger portrait
- Borrower Record Centre (search, file, export)
- Guarantor SMS on loan approved, fully repaid, and >2 missed periods
- Loan workflow stepper sequence
- Borrower SMS lifecycle copy already aligned; premature GROUP_ASSIGNED removed for pending members

## Unresolved / deferred

- Expense submitted counts on collector cards remain a separate metric stub where previously zero
- Official GhanaPost GPS API is not called; next sprint is planning-only until this release is certified
- Authenticated production UI smoke still requires operator credentials
