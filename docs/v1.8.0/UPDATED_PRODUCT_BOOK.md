# Updated Product Book — v1.8.0

WILMS v1.8.0 elevates the product to a premium field-operations platform:

- Automatic Ghana holiday intelligence
- Offline-ready role shells
- Automation for reminders, escalations, and follow-ups
- iOS-inspired enterprise UI language

### Post-release UI update (same release identity)

- Cleaner financial operations dashboards without redundant guidance panels
- Collector dashboard focused on collection performance (quick-action chrome removed)
- Communication Center compose console with clear audience + preview
- Consistent responsive tables and status pills
- Raise Flag selects entities by human-readable identity

### Multi-week catch-up and grace (same release identity)

- Collectors may clear multiple oldest payable weeks in one action (`weeksCount`), posting one payment row per week at the weekly installment
- Expected collections on field and admin surfaces sum payable weeks (including arrears), not a single installment alone
- Late-payment grace defaults to three days (`latePaymentGraceDays`) and remains Settings-configurable; mark missed is a schedule event, not a payment
- Payment notifications follow a T−1…T+7 ladder (due soon through escalated) via the existing payment notification scheduler

See finance design notes under `documentation/finance/` and the full pack in `docs/v1.8.0/` / official library under `documentation/`.
