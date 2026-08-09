'use client';

import { useState } from 'react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { PinEntryPad } from '@/features/app-lock/components/PinEntryPad';
import { appLockPinSchema, setAppLockPinSchema } from '@/features/app-lock/app-lock.schema';
import { APP_LOCK_IDLE_TIMEOUT_OPTIONS_MS, APP_LOCK_PIN_LENGTH } from '@/constants/app-lock';
import { useAuth } from '@/hooks/useAuth';
import { useAppLockStore } from '@/state/appLockStore';
import { Select } from '@/components/ui/Select';
import { isWebAuthnAvailable, registerAppLockCredential } from '@/lib/security/webauthn-app-lock';

type SetupStep = 'intro' | 'enter' | 'confirm';

export function AppLockSetupPanel({ mandatory = false }: { mandatory?: boolean }) {
  const { user } = useAuth();
  const isEnabled = useAppLockStore((state) => state.isEnabled);
  const idleTimeoutMs = useAppLockStore((state) => state.idleTimeoutMs);
  const biometricsEnabled = useAppLockStore((state) => state.biometricsEnabled);
  const setPin = useAppLockStore((state) => state.setPin);
  const clearPin = useAppLockStore((state) => state.clearPin);
  const setIdleTimeoutMs = useAppLockStore((state) => state.setIdleTimeoutMs);
  const setBiometricsEnabled = useAppLockStore((state) => state.setBiometricsEnabled);
  const [step, setStep] = useState<SetupStep>('intro');
  const [draftPin, setDraftPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const webAuthnSupported = typeof window !== 'undefined' && isWebAuthnAvailable();

  const resetFlow = () => {
    setStep('intro');
    setDraftPin('');
    setErrorMessage(null);
  };

  const handleDisable = () => {
    clearPin();
    setSuccessMessage('App lock disabled on this device.');
    resetFlow();
  };

  const handleEnterPin = (pin: string) => {
    const parsed = appLockPinSchema.safeParse(pin);

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Invalid PIN.');
      return;
    }

    setDraftPin(pin);
    setErrorMessage(null);
    setStep('confirm');
  };

  const handleConfirmPin = (confirmPin: string) => {
    if (!user?.id) {
      return;
    }

    const parsed = setAppLockPinSchema.safeParse({ pin: draftPin, confirmPin });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'PIN entries do not match.');
      setStep('enter');
      setDraftPin('');
      return;
    }

    setPin(parsed.data.pin, user.id);
    setSuccessMessage('Six-digit app lock enabled.');
    resetFlow();
  };

  return (
    <section className="rounded-sm border border-border bg-card p-wilms-6">
      <h2 className="text-heading-2 font-semibold text-text-primary">App lock</h2>
      <p className="mt-wilms-2 text-body text-text-muted">
        {mandatory
          ? 'A six-digit PIN is required for all WILMS roles. Biometrics may be used on supported devices after PIN setup.'
          : `Protect this device with a ${APP_LOCK_PIN_LENGTH}-digit PIN. The lock screen appears after inactivity or when you return to the app. This does not replace your sign-in password.`}
      </p>

      {successMessage ? (
        <Alert title="App lock updated" variant="success" className="mt-wilms-4">
          {successMessage}
        </Alert>
      ) : null}

      {isEnabled ? (
        <div className="mt-wilms-4 space-y-wilms-3" data-tour="app-lock">
          <p className="text-small font-semibold text-success">Enabled on this device</p>
          <label className="block text-small text-text-muted">
            Auto-lock after inactivity
            <Select
              className="mt-1"
              value={String(idleTimeoutMs)}
              onChange={(event) =>
                setIdleTimeoutMs(Number(event.target.value) as (typeof APP_LOCK_IDLE_TIMEOUT_OPTIONS_MS)[number])
              }
            >
              {APP_LOCK_IDLE_TIMEOUT_OPTIONS_MS.map((ms) => (
                <option key={ms} value={ms}>
                  {ms < 60_000 ? `${ms / 1000} seconds` : `${ms / 60_000} minutes`}
                </option>
              ))}
            </Select>
          </label>
          {webAuthnSupported ? (
            <div className="flex flex-wrap items-center gap-wilms-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void (async () => {
                    try {
                      await registerAppLockCredential(user?.id ?? 'wilms-user');
                      setBiometricsEnabled(true);
                      setSuccessMessage('Biometric unlock enabled. PIN remains the fallback.');
                    } catch (error) {
                      setErrorMessage(
                        error instanceof Error ? error.message : 'Unable to enable biometrics.',
                      );
                    }
                  })();
                }}
              >
                {biometricsEnabled ? 'Re-enrol biometrics' : 'Enable biometric unlock'}
              </Button>
              {biometricsEnabled ? (
                <Button type="button" variant="ghost" onClick={() => setBiometricsEnabled(false)}>
                  Disable biometrics
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-small text-text-muted">
              Biometrics are not available in this browser. PIN unlock remains required.
            </p>
          )}
          <div className="flex flex-wrap gap-wilms-3">
            <Button type="button" variant="secondary" onClick={() => setStep('enter')}>
              Change PIN
            </Button>
            {!mandatory ? (
              <Button type="button" variant="danger" onClick={handleDisable}>
                Disable app lock
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <Button type="button" className="mt-wilms-4" onClick={() => setStep('enter')} data-tour="app-lock">
          Set up app lock
        </Button>
      )}

      {step === 'enter' ? (
        <div className="mt-wilms-6 border-t border-border pt-wilms-6">
          <PinEntryPad
            label="Choose a PIN"
            onComplete={handleEnterPin}
            errorMessage={errorMessage}
          />
          <Button type="button" variant="ghost" className="mt-wilms-4 w-full" onClick={resetFlow}>
            Cancel
          </Button>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div className="mt-wilms-6 border-t border-border pt-wilms-6">
          <PinEntryPad
            label="Confirm PIN"
            onComplete={handleConfirmPin}
            errorMessage={errorMessage}
          />
          <Button type="button" variant="ghost" className="mt-wilms-4 w-full" onClick={resetFlow}>
            Cancel
          </Button>
        </div>
      ) : null}
    </section>
  );
}
