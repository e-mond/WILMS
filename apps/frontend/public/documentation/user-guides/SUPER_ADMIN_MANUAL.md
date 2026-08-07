# WILMS Super Admin Manual

**Version:** 1.7.3  
**Role:** Super Admin  
**Classification:** Confidential

---

## 1. Overview

Super Admins have full programme control including user management, loan pools, capital operations, expenses, communications, operations, and system settings. This manual covers daily administrative tasks.

---

## 2. Getting started

### Login

Navigate to the WILMS URL. Enter email and password. Complete OTP challenge if enabled. You land on the operational dashboard.

### Navigation

The admin sidebar includes: Dashboard, Applications, Groups, Collectors, Loan Pools, Risk Flags, Expenses, Reports, Executive Intelligence, Communications, Ops, Audit, Settings.

**Note (v1.7.3):** The standalone Export Center route has been removed. Export reports and data using contextual export buttons on report pages, borrower profiles, and executive intelligence.

---

## 3. Dashboard

The operational dashboard shows:
- Reconciliation aging summary
- Pending reconciliation table
- Recent Activity feed (audit log, time-grouped)
- Collection metrics and financial KPIs
- Quick links to pending items

Use this dashboard for daily operational oversight.

---

## 4. User management

### Invite a user

1. Settings → Users → Invite User
2. Enter email, display name, role
3. User receives invitation email
4. First login activates account

### Edit user

Change display name, role, or status. Role changes take effect on next login.

### Permission overrides

Grant specific permissions beyond role defaults. Document reason in audit trail.

### Force logout

Use when personnel leave or security incident occurs. Invalidates all sessions immediately.

---

## 5. Loan pool management

### Create pool

Settings or Loan Pools → Create. Set name, initial capital (replenishment).

### Replenish capital

Loan Pools → Select pool → Replenish. Enter amount in GHS. Creates replenishment transaction.

### Monitor utilisation

Dashboard and pool detail show: total capital, disbursed, collected, available, outstanding.

### Adjustments

Capital corrections require audited adjustment transaction. Follow maker-checker policy — do not self-approve where SoD applies.

---

## 6. Expense management

### Review pending expenses

Expenses → Pending Review. Approve or reject with reason. You cannot approve your own submissions.

### Post HQ expenses

Expenses → New Expense. Enter details, amount, category. Submit for review by another admin.

---

## 7. Communications

### Send broadcast

Communications → New Broadcast. Select recipients (role or all). Compose message or use template.

### Manage templates

Communications → Templates. Create reusable templates with variable placeholders.

---

## 8. Reports and exports

### Generate reports

Reports → Select report type → Set filters → Run. Results display in-page.

### Export

Use export buttons on the report results page: PDF, Excel, CSV, or Print. Branded PDF includes confidentiality footer.

### Executive intelligence

Navigate to Executive Intelligence for board-grade KPIs. Use contextual export for compliance packs.

---

## 9. Operations

### Incidents

Ops → Incidents → Create. Document severity, description, resolution steps.

### Maintenance windows

Ops → Maintenance → Schedule. Users see banner during window.

---

## 10. Audit log

Audit → Filter by action, actor, date range. Read-only. Use for compliance reviews and incident investigation.

---

## 11. Settings

Organisation name, notification preferences, quiet hours, holiday calendar, demo mode (development only).

---

## 12. Best practices

- Review reconciliation aging daily
- Never share admin credentials
- Use force-logout when staff depart
- Export compliance packs before board meetings
- Schedule maintenance windows before major updates

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
