export const NOTIFICATION_CHANNEL = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

export const NOTIFICATION_EVENT = {
  REGISTRATION_APPROVED: 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED: 'REGISTRATION_REJECTED',
  LOAN_DISBURSED: 'LOAN_DISBURSED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_REMINDER: 'PAYMENT_REMINDER',
  MISSED_PAYMENT: 'MISSED_PAYMENT',
  DEFAULTER_STATUS: 'DEFAULTER_STATUS',
  LOAN_COMPLETED: 'LOAN_COMPLETED',
  GUARANTOR_ALERT: 'GUARANTOR_ALERT',
  SUPERVISOR_ALERT: 'SUPERVISOR_ALERT',
} as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENT)[keyof typeof NOTIFICATION_EVENT];

export interface SendNotificationInput {
  event: NotificationEvent;
  channels: NotificationChannel[];
  recipientPhone?: string;
  recipientEmail?: string;
  message: string;
  borrowerId?: string;
  loanId?: string;
}

export interface NotificationDelivery {
  id: string;
  event: NotificationEvent;
  channels: NotificationChannel[];
  recipientPhone?: string;
  recipientEmail?: string;
  message: string;
  borrowerId?: string;
  loanId?: string;
  sentAt: string;
}

export const NOTIFICATION_INBOX_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;

export type NotificationInboxSeverity =
  (typeof NOTIFICATION_INBOX_SEVERITY)[keyof typeof NOTIFICATION_INBOX_SEVERITY];

export interface NotificationInboxItem {
  id: string;
  title: string;
  body: string;
  event: NotificationEvent;
  href?: string;
  createdAt: string;
  isRead: boolean;
  severity: NotificationInboxSeverity;
  /** Optional subject for avatar display in the inbox. */
  subjectName?: string;
  subjectId?: string;
  subjectPhotoUrl?: string | null;
}
