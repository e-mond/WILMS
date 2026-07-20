'use client';

const STORAGE_KEY = 'wilms-notification-sounds-enabled';

let sharedAudioContext: AudioContext | null = null;

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

let warmScheduled = false;

function warmAudioContextNow(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextCtor();
    }

    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume();
    }
  } catch {
    // Audio unavailable — ignore.
  }
}

/**
 * Unlock AudioContext during a user gesture so post-login tones can play.
 * Deferred off the event handler critical path to avoid INP regressions on inputs.
 */
export function warmAudioContext(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (sharedAudioContext && sharedAudioContext.state === 'running') {
    return;
  }

  if (warmScheduled) {
    return;
  }

  warmScheduled = true;
  window.setTimeout(() => {
    warmScheduled = false;
    warmAudioContextNow();
  }, 0);
}

function playTone(frequency: number, durationMs: number): void {
  if (typeof window === 'undefined' || !readPreference()) {
    return;
  }

  try {
    // Playback needs the context immediately; gesture warm stays deferred separately.
    warmAudioContextNow();
    const context = sharedAudioContext;
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.03;
    oscillator.connect(gain);
    gain.connect(context.destination);
    const startAt = context.currentTime;
    oscillator.start(startAt);
    oscillator.stop(startAt + durationMs / 1000);
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
  window.setTimeout(() => playTone(880, 100), 110);
}

export function playLogoutSound(): void {
  playTone(440, 120);
}

export function playMessageSound(): void {
  playTone(587, 140);
}

export function playNotificationSound(): void {
  playTone(523, 120);
}

export function playSecurityAlertSound(): void {
  playTone(330, 220);
}

export function playLoanDecisionSound(approved: boolean): void {
  playTone(approved ? 784 : 392, approved ? 160 : 200);
}

export function useNotificationSound() {
  return {
    warm: warmAudioContext,
    playLogin: playLoginSound,
    playLogout: playLogoutSound,
    playApproval: () => playTone(784, 160),
    playRejection: () => playTone(392, 200),
    playAssignment: () => playTone(523, 140),
    playInvite: () => playTone(698, 140),
    playMessage: playMessageSound,
    playNotification: playNotificationSound,
    playSecurityAlert: playSecurityAlertSound,
    playLoanDecision: playLoanDecisionSound,
    setEnabled: setNotificationSoundsEnabled,
    isEnabled: areNotificationSoundsEnabled,
  };
}
