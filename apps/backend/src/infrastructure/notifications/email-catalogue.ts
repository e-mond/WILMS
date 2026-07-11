/**
 * Central catalogue of WILMS transactional email templates.
 * Single source of truth for coverage audits and communication platform routing.
 */

export const EMAIL_TEMPLATE_CATALOGUE = {
  authentication: [
    { id: 'welcome', builder: 'buildWelcomeEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'verify-email', builder: 'buildVerifyEmailEmail', channels: ['EMAIL'] },
    { id: 'password-reset', builder: 'buildPasswordResetEmail', channels: ['EMAIL'] },
    { id: 'password-changed', builder: 'buildPasswordChangedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'login-alert', builder: 'buildLoginAlertEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'user-invitation', builder: 'buildUserInvitationEmail', channels: ['EMAIL'] },
    { id: 'invitation-reminder', builder: 'buildInvitationReminderEmail', channels: ['EMAIL'] },
    { id: 'invitation-accepted', builder: 'buildInvitationAcceptedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'invitation-expired', builder: 'buildInvitationExpiredEmail', channels: ['EMAIL'] },
    { id: 'account-activated', builder: 'buildAccountActivatedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'account-disabled', builder: 'buildAccountDisabledEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'account-enabled', builder: 'buildAccountEnabledEmail', channels: ['EMAIL', 'IN_APP'] },
  ],
  registration: [
    { id: 'registration-approved', builder: 'buildRegistrationApprovedEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
    { id: 'registration-rejected', builder: 'buildRegistrationRejectedEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
  ],
  loans: [
    { id: 'loan-approval', builder: 'buildLoanApprovalEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
    { id: 'loan-rejected', builder: 'buildLoanRejectedEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
    { id: 'loan-disbursed', builder: 'buildLoanDisbursedEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
    { id: 'loan-closed', builder: 'buildLoanClosedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'loan-fully-paid', builder: 'buildLoanFullyPaidEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'loan-default', builder: 'buildLoanDefaultEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'loan-reminder', builder: 'buildLoanReminderEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
  ],
  payments: [
    { id: 'payment-confirmation', builder: 'buildPaymentConfirmationEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
    { id: 'payment-reversal', builder: 'buildPaymentReversalEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'collection-reminder', builder: 'buildCollectionReminderEmail', channels: ['EMAIL', 'SMS', 'IN_APP'] },
  ],
  groups: [
    { id: 'group-created', builder: 'buildGroupCreatedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'group-leader-assigned', builder: 'buildGroupLeaderAssignedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'collector-assigned', builder: 'buildCollectorAssignedEmail', channels: ['EMAIL', 'IN_APP'] },
  ],
  administration: [
    { id: 'user-role-changed', builder: 'buildUserRoleChangedEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'maintenance-notice', builder: 'buildMaintenanceNoticeEmail', channels: ['EMAIL', 'IN_APP'] },
    { id: 'announcement', builder: 'buildAnnouncementEmail', channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] },
  ],
} as const;

export const EMAIL_TEMPLATE_VARIABLES = [
  'firstName',
  'lastName',
  'fullName',
  'email',
  'loanNumber',
  'loanDisplayId',
  'amount',
  'collector',
  'collectorName',
  'groupName',
  'dueDate',
  'paymentDate',
] as const;

export type EmailTemplateCategory = keyof typeof EMAIL_TEMPLATE_CATALOGUE;

export function listAllEmailTemplates(): Array<{
  category: EmailTemplateCategory;
  id: string;
  builder: string;
  channels: readonly string[];
}> {
  return (Object.entries(EMAIL_TEMPLATE_CATALOGUE) as Array<[EmailTemplateCategory, typeof EMAIL_TEMPLATE_CATALOGUE[EmailTemplateCategory]]>).flatMap(
    ([category, items]) =>
      items.map((item) => ({
        category,
        ...item,
      })),
  );
}
