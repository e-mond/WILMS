# FINAL_MANUAL_QA_CHECKLIST.md

**Release candidate:** v1.3.8  
**Purpose:** Role-complete manual QA before production certification  
**Environment:** Staging first, then production with smoke credentials

Legend: `[ ]` pending · `[x]` done · `N/A` not applicable

---

## Cross-Cutting (All Staff Roles)

- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows friendly error
- [ ] Session persists across browser refresh
- [ ] Idle / app lock behavior (where enabled)
- [ ] Session expiry redirects to `/session-expired`
- [ ] Logout clears session
- [ ] Offline → online recovery (collector devices)
- [ ] Toast appears **once** for a new message notification (login, refresh, tab focus)
- [ ] First-login welcome tour appears; Not Now / Don't show again persist
- [ ] Help FAB (bottom-right): Restart Tour works
- [ ] Skeleton loaders appear on slow networks (no spinner CLS)
- [ ] Keyboard: Tab order sane; Escape closes modals
- [ ] Dark / light theme toggles without contrast failures on badges
- [ ] Mobile bottom navigation works without announcing false tabs

---

## Super Admin

### Dashboard
- [ ] KPI cards load
- [ ] Financial overview cards/charts toggle persists
- [ ] Route error boundary recovers via Try again (force error in staging only)

### Loan Pools
- [ ] List pools
- [ ] Open pool detail
- [ ] Create pool (if permitted)
- [ ] Utilisation figures match expectations

### Collections / Daily Collection
- [ ] Expected vs collected variance visible
- [ ] Filters apply

### Reconciliation
- [ ] Review queue loads
- [ ] Approve reconciliation
- [ ] Reject reconciliation with reason
- [ ] Concurrent review by second admin does not double-apply (staging)

### Expenses
- [ ] List / approve / reject expense

### Reports
- [ ] Daily collection
- [ ] Loan portfolio
- [ ] Financial ledger
- [ ] Defaulters
- [ ] Audit log
- [ ] Export CSV / print where available

### Communication Center
- [ ] Create/edit template
- [ ] Preview sanitizes script tags
- [ ] Send test / campaign (staging)

### Settings
- [ ] System settings save
- [ ] Integrations status visible
- [ ] Test email (Gmail path) requires real session (forged cookie rejected)
- [ ] Test SMS
- [ ] Users: invite, resend, suspend, activate, delete
- [ ] User profile: permission overrides grant/revoke/remove + audit
- [ ] Roles: clone (unique name), delete (confirm), system roles protected
- [ ] Notification preferences

### Borrowers / Groups / Collectors / Loans
- [ ] Create/view/edit critical paths
- [ ] Disbursement gate respects admin fee
- [ ] Risk flags escalate/resolve

---

## Registration Officer

- [ ] New Registration wizard completes (photos, ID, GPS, guarantor)
- [ ] Validation errors are clear
- [ ] My Registrations list filters by status
- [ ] Cannot delete another officer’s registration (non-admin)
- [ ] Document uploads respect size limits
- [ ] Draft save/resume (if enabled)

---

## Approver

- [ ] Pending queue loads
- [ ] Open borrower details + document preview
- [ ] Approve application
- [ ] Reject with reason
- [ ] Reviewed list shows **own** decisions only (unless Super Admin)
- [ ] Cannot post payments

---

## Collector

- [ ] Dashboard today’s groups/expected
- [ ] Record payment (full weekly amount only)
- [ ] Duplicate same-day payment rejected
- [ ] Wrong payment day rejected
- [ ] Expenses submit
- [ ] Messages inbox reply
- [ ] Notifications bell
- [ ] Reconciliation end-of-day submit
- [ ] Offline queue: record while offline, sync when online
- [ ] Cannot create admin message threads / send broadcast notifications
- [ ] Cannot approve loans or reverse payments

---

## Auditor

- [ ] Audit logs read-only
- [ ] Reports accessible
- [ ] Financial exports
- [ ] Reconciliation history visible
- [ ] Mutations denied (payments, approvals, settings)

---

## Borrower (if portal/capture surfaces apply)

- [ ] Public photo-capture token flow works until expiry
- [ ] Expired token rejected
- [ ] No staff data leakage on public routes

---

## Security Smoke (Manual)

- [ ] Tampered session cookie cannot call `/api/mail/gmail`
- [ ] Collector cannot clone roles / manage users
- [ ] CSRF missing header fails mutating BFF calls
- [ ] XSS payload in template preview does not execute

---

## Sign-off

| Role | Tester | Date | Result |
|---|---|---|---|
| Super Admin | | | |
| Registration Officer | | | |
| Approver | | | |
| Collector | | | |
| Auditor | | | |
| Borrower / Capture | | | |
