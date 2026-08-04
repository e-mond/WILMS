# App Lock Audit

Recorded: 2026-06-09

---

## Flows

### First-time PIN setup (`AppLockSetupPanel`)

| Check | Status |
|---|---|
| Keypad input | Pass |
| Keyboard 0–9 | Pass (shared `PinEntryPad`) |
| Backspace / Enter | Pass |
| Confirm step | Pass |

### Unlock overlay (`AppLockOverlay`)

| Check | Before | After P11e |
|---|---|---|
| Keyboard digits | Unreliable (`readOnly` input) | Pass — editable hidden input + `onChange` |
| Numpad | Partial | Pass — `inputMode="numeric"` |
| Backspace | Pass | Pass |
| Delete | Missing | Pass |
| Enter submit | Partial | Pass — submits when 6 digits |
| Tab navigation | Partial | Pass — focus trap on dialog |
| Auto-focus | Missing | Pass — `autoFocus` + ref on mount |
| Focus trap | Missing | Pass — Tab cycles within overlay |

---

## Fixes applied

### `PinEntryPad.tsx`

- Removed `readOnly` from PIN input (enables mobile soft keyboard)
- `forwardRef` + `focusInput()` for overlay mount focus
- `normalizePinInput()` on change
- Delete key support
- Enter submits complete PIN
- Window + input `keydown` handlers
- `autoFocus` prop (default true)

### `AppLockOverlay.tsx`

- Focus trap (Tab wrap inside dialog)
- Auto-focus PIN input on mount via ref

### Tests

- `PinEntryPad.test.tsx` — added keyboard entry test

---

## Accessibility

| Requirement | Status |
|---|---|
| `role="dialog"` + `aria-modal` | Pass |
| `aria-label` on PIN input | Pass |
| `aria-live` error region | Pass |
| 44px keypad buttons (`size="lg"`) | Pass |
| Screen reader hint text | Pass |

---

## Sign-off

Unlock overlay keyboard input matches first-time setup behaviour.
