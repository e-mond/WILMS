'use client';

const STORAGE_KEY = 'wilms-notification-sounds-enabled';

function readPreference(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'false') {
    return false;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  return true;
}

function playTone(frequency: number, durationMs: number): void {
  if (typeof window === 'undefined' || !readPreference()) {
    return;
  }

  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.03;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + durationMs / 1000);
    window.setTimeout(() => void context.close(), durationMs + 50);
  } catch {
    // Audio unavailable — ignore.
  }
}

export function setNotificationSoundsEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }
}

export function areNotificationSoundsEnabled(): boolean {
  return readPreference();
}

export function playLoginSound(): void {
  playTone(660, 120);
}

export function playLogoutSound(): void {
  playTone(440, 120);
}

export function playMessageSound(): void {
  playTone(587, 140);
}

export function playSecurityAlertSound(): void {
  playTone(330, 220);
}

export function playLoanDecisionSound(approved: boolean): void {
  playTone(approved ? 784 : 392, approved ? 160 : 200);
}

export function useNotificationSound() {
  return {
    playLogin: playLoginSound,
    playLogout: playLogoutSound,
    playApproval: () => playTone(784, 160),
    playRejection: () => playTone(392, 200),
    playAssignment: () => playTone(523, 140),
    playInvite: () => playTone(698, 140),
    playMessage: playMessageSound,
    playSecurityAlert: playSecurityAlertSound,
    playLoanDecision: playLoanDecisionSound,
    setEnabled: setNotificationSoundsEnabled,
    isEnabled: areNotificationSoundsEnabled,
  };
}
