# WCAG 2.2 AA Manual Checklist

**Version:** 1.4.2 | **Phase:** 29  
**Tester:** _______________ **Date:** _______________  
**Environment:** Staging URL _______________  
**Browsers:** Chrome ___ Firefox ___ Safari ___  
**Assistive tech:** NVDA ___ VoiceOver ___ JAWS ___

Record PASS / FAIL / N/A for each item. Attach screenshots or screen recordings for failures.

---

## 1. Perceivable

| # | Criterion | Check | Result | Notes |
|---|-----------|-------|--------|-------|
| 1.1 | Non-text content has text alternatives | Images, icons, charts | | |
| 1.3 | Info and relationships programmatic | Headings, tables, forms | | |
| 1.4.3 | Contrast (minimum 4.5:1 text) | Login, dashboard, forms | | |
| 1.4.4 | Resize text to 200% | No horizontal scroll / clipped content | | |
| 1.4.10 | Reflow at 320px width | Mobile borrower list, payment entry | | |
| 1.4.11 | Non-text contrast 3:1 | Buttons, focus rings, icons | | |

## 2. Operable

| # | Criterion | Check | Result | Notes |
|---|-----------|-------|--------|-------|
| 2.1.1 | Keyboard — all functionality | Tab through main nav + forms | | |
| 2.1.2 | No keyboard trap | Modals, drawers, command palette | | |
| 2.4.3 | Focus order logical | Registration wizard, loan form | | |
| 2.4.7 | Focus visible | All interactive elements | | |
| 2.5.5 | Target size (44×44px min) | Mobile collector payment | | |

## 3. Understandable

| # | Criterion | Check | Result | Notes |
|---|-----------|-------|--------|-------|
| 3.1.1 | Page language set | `<html lang>` | | |
| 3.2.1 | Focus does not change context | Auto-submit on focus | | |
| 3.3.1 | Error identification | Form validation messages | | |
| 3.3.2 | Labels or instructions | All required fields | | |

## 4. Robust

| # | Criterion | Check | Result | Notes |
|---|-----------|-------|--------|-------|
| 4.1.2 | Name, role, value | Buttons, switches, tables | | |
| 4.1.3 | Status messages | Toasts, live regions | | |

---

## Role-Specific Flows

Complete each flow with keyboard only, then with screen reader.

| Role | Flow | Result | Notes |
|------|------|--------|-------|
| Super Admin | Login → Dashboard → Users list | | |
| Collector | Login → My borrowers → Record payment | | |
| Officer | Login → Register borrower (wizard) | | |
| Approver | Login → Pending approvals → Review | | |
| Auditor | Login → Audit log → Export | | |

---

## Summary

| Total PASS | Total FAIL | Total N/A |
|------------|------------|-----------|
| | | |

**Overall WCAG 2.2 AA:** PASS / FAIL

**Evidence file:** `docs/certification/v1.4/phase-29/evidence/operator/wcag-<date>.pdf`

**Sign-off:** _______________
