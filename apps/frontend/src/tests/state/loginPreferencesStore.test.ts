import { beforeEach, describe, expect, it } from 'vitest';
import { useLoginPreferencesStore } from '@/state/loginPreferencesStore';

describe('loginPreferencesStore', () => {
  beforeEach(() => {
    useLoginPreferencesStore.setState({
      rememberEmail: false,
      rememberedEmail: '',
      isHydrated: true,
    });
    localStorage.removeItem('wilms-login-preferences');
  });

  it('stores remembered email when enabled', () => {
    useLoginPreferencesStore.getState().setRememberEmail(true);
    useLoginPreferencesStore.getState().setRememberedEmail('officer@wilms.demo');

    expect(useLoginPreferencesStore.getState().rememberEmail).toBe(true);
    expect(useLoginPreferencesStore.getState().rememberedEmail).toBe('officer@wilms.demo');
  });

  it('clears remembered email when remember is disabled', () => {
    useLoginPreferencesStore.getState().setRememberEmail(true);
    useLoginPreferencesStore.getState().setRememberedEmail('officer@wilms.demo');
    useLoginPreferencesStore.getState().setRememberEmail(false);

    expect(useLoginPreferencesStore.getState().rememberedEmail).toBe('');
  });
});
