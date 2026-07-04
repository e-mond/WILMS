const PREFIX = 'wilms.role-settings.';

function readBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  const stored = window.localStorage.getItem(`${PREFIX}${key}`);
  if (stored === 'true') {
    return true;
  }
  if (stored === 'false') {
    return false;
  }

  return defaultValue;
}

function writeBoolean(key: string, value: boolean): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${PREFIX}${key}`, value ? 'true' : 'false');
  }
}

function readString(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  return window.localStorage.getItem(`${PREFIX}${key}`) ?? defaultValue;
}

function writeString(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${PREFIX}${key}`, value);
  }
}

export const roleSettingsPreferences = {
  getPushNotifications: () => readBoolean('push-notifications', true),
  setPushNotifications: (value: boolean) => writeBoolean('push-notifications', value),
  getEmailSummaries: () => readBoolean('email-summaries', false),
  setEmailSummaries: (value: boolean) => writeBoolean('email-summaries', value),
  getAutoSync: () => readBoolean('auto-sync', true),
  setAutoSync: (value: boolean) => writeBoolean('auto-sync', value),
  getSyncInterval: () => readString('sync-interval', '15'),
  setSyncInterval: (value: string) => writeString('sync-interval', value),
  getGpsVerification: () => readBoolean('gps-verification', true),
  setGpsVerification: (value: boolean) => writeBoolean('gps-verification', value),
  getLowDataMode: () => readBoolean('low-data-mode', false),
  setLowDataMode: (value: boolean) => writeBoolean('low-data-mode', value),
  getPreferredCapture: () => readString('preferred-capture', 'mobile'),
  setPreferredCapture: (value: string) => writeString('preferred-capture', value),
  getPassportCropGuide: () => readBoolean('passport-crop-guide', true),
  setPassportCropGuide: (value: boolean) => writeBoolean('passport-crop-guide', value),
  getHighRiskAlerts: () => readBoolean('high-risk-alerts', true),
  setHighRiskAlerts: (value: boolean) => writeBoolean('high-risk-alerts', value),
  getDefaultExportScope: () => readString('default-export-scope', '30'),
  setDefaultExportScope: (value: string) => writeString('default-export-scope', value),
};
