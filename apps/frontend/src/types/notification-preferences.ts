export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  marketingEnabled: boolean;
  announcementsEnabled: boolean;
  remindersEnabled: boolean;
  loanNotifications: boolean;
  paymentNotifications: boolean;
  approvalNotifications: boolean;
  registrationNotifications: boolean;
  digestFrequency: 'INSTANT' | 'DAILY' | 'WEEKLY';
}
