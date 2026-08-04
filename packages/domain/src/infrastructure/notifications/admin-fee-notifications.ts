import { getSettings } from '../../modules/settings/service.js';
import { appendAuditEntry } from '../audit/audit-log.js';
import { getMailProvider } from '../mail/index.js';
import { getSmsProvider } from '../sms/index.js';
import { normalizeGhanaPhone } from '../sms/normalize-phone.js';
import { logMessageDelivery } from './delivery-log.js';
import { createInAppNotification } from './in-app-notify.js';
import {
  markNotificationDeliveryStatus,
  tryAcquireNotificationDelivery,
} from './notification-dedupe.js';
import { resolveCollectorUserIdForBorrower } from './payment-notifications.js';
import {
  buildAdminFeeConfirmationSmsBody,
  formatGhsAmount,
} from './templates.js';
import {
  buildEmailTemplate,
  emailParagraph,
  emailReceipt,
} from './email-layout.js';

export const ADMIN_FEE_DEDUPE = {
  confirmed: (transactionId: string) => `admin-fee-confirmed:${transactionId}`,
} as const;

/**
 * Notify borrower (SMS/email) and collector (in-app) after admin fee is recorded.
 * Deduped by transaction id so retries never send duplicate SMS.
 */
export async function notifyAdminFeeRecorded(input: {
  transactionId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  paymentDate: string;
  loanDisplayId?: string;
  loanId?: string;
  collectorUserId?: string;
  actorUserId: string;
  actorDisplayName?: string;
}): Promise<{ smsSent: boolean; emailSent: boolean; inAppSent: boolean }> {
  const settings = await getSettings();
  const dedupeKey = ADMIN_FEE_DEDUPE.confirmed(input.transactionId);
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const paymentDate = input.paymentDate.slice(0, 10);
  let smsSent = false;
  let emailSent = false;
  let inAppSent = false;

  if (input.borrowerPhone?.trim()) {
    const acquired = await tryAcquireNotificationDelivery({
      dedupeKey,
      recipient: input.borrowerPhone,
      channel: 'SMS',
      notificationType: 'ADMIN_FEE_CONFIRMED',
      correlationId: input.transactionId,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });

    if (acquired) {
      if (!settings.smsNotificationsEnabled) {
        await markNotificationDeliveryStatus({
          dedupeKey,
          recipient: input.borrowerPhone,
          channel: 'SMS',
          status: 'FAILED',
          failureReason: 'SMS disabled in system settings',
        });
      } else {
        const provider = getSmsProvider();
        if (!provider.isConfigured()) {
          await markNotificationDeliveryStatus({
            dedupeKey,
            recipient: input.borrowerPhone,
            channel: 'SMS',
            status: 'FAILED',
            failureReason: 'SMS provider not configured',
          });
        } else {
          try {
            const body = buildAdminFeeConfirmationSmsBody({
              amountPesewas: input.amountPesewas,
              loanDisplayId: input.loanDisplayId,
              paymentDate,
            });
            const result = await provider.send({
              to: normalizeGhanaPhone(input.borrowerPhone),
              body,
            });
            await logMessageDelivery({
              event: 'ADMIN_FEE_RECORDED',
              channel: 'SMS',
              recipient: input.borrowerPhone,
              provider: result.provider,
              providerMessageId: result.id,
              bodyPreview: body,
              success: true,
              borrowerId: input.borrowerId,
              loanId: input.loanId,
            });
            await markNotificationDeliveryStatus({
              dedupeKey,
              recipient: input.borrowerPhone,
              channel: 'SMS',
              status: 'SENT',
            });
            smsSent = true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'SMS delivery failed';
            await markNotificationDeliveryStatus({
              dedupeKey,
              recipient: input.borrowerPhone,
              channel: 'SMS',
              status: 'FAILED',
              failureReason: message,
            });
          }
        }
      }
    }
  }

  if (input.borrowerEmail?.trim() && settings.emailNotificationsEnabled) {
    const emailDedupe = `${dedupeKey}:email`;
    const acquired = await tryAcquireNotificationDelivery({
      dedupeKey: emailDedupe,
      recipient: input.borrowerEmail,
      channel: 'EMAIL',
      notificationType: 'ADMIN_FEE_CONFIRMED',
      correlationId: input.transactionId,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });

    if (acquired) {
      try {
        const provider = getMailProvider();
        const loanLine = input.loanDisplayId ? ` for Loan ${input.loanDisplayId}` : '';
        const template = buildEmailTemplate({
          subject: `WILMS admin fee receipt — GHS ${amountGhs}`,
          greeting: input.borrowerName,
          preheader: `Admin fee of GHS ${amountGhs} received`,
          theme: 'success',
          textLines: [
            `Dear ${input.borrowerName},`,
            '',
            `We have received your admin fee of GHS ${amountGhs}${loanLine} on ${paymentDate}. Your application can now proceed to approval.`,
            '',
            '— WILMS',
          ],
          htmlBody: [
            emailParagraph(
              `We have received your admin fee of GHS ${amountGhs}${loanLine}. Your application can now proceed to approval.`,
            ),
            emailReceipt([
              { label: 'Amount', value: `GHS ${amountGhs}` },
              { label: 'Payment date', value: paymentDate },
              ...(input.loanDisplayId
                ? [{ label: 'Loan', value: input.loanDisplayId }]
                : []),
            ]),
          ].join(''),
        });
        await provider.send({
          to: input.borrowerEmail,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
        await markNotificationDeliveryStatus({
          dedupeKey: emailDedupe,
          recipient: input.borrowerEmail,
          channel: 'EMAIL',
          status: 'SENT',
        });
        emailSent = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Email delivery failed';
        await markNotificationDeliveryStatus({
          dedupeKey: emailDedupe,
          recipient: input.borrowerEmail,
          channel: 'EMAIL',
          status: 'FAILED',
          failureReason: message,
        });
      }
    }
  }

  const collectorUserId =
    input.collectorUserId ?? (await resolveCollectorUserIdForBorrower(input.borrowerId));

  if (collectorUserId) {
    const inAppDedupe = `${dedupeKey}:in-app:${collectorUserId}`;
    const acquired = await tryAcquireNotificationDelivery({
      dedupeKey: inAppDedupe,
      recipient: collectorUserId,
      channel: 'IN_APP',
      notificationType: 'ADMIN_FEE_CONFIRMED',
      correlationId: input.transactionId,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      userId: collectorUserId,
    });

    if (acquired) {
      await createInAppNotification({
        userId: collectorUserId,
        event: 'PAYMENT_RECEIVED',
        title: 'Admin fee recorded',
        body: `GHS ${amountGhs} admin fee received from ${input.borrowerName}${
          input.loanDisplayId ? ` (${input.loanDisplayId})` : ''
        }.`,
        href: `/collector/admin-fee/${input.borrowerId}`,
        borrowerId: input.borrowerId,
        loanId: input.loanId,
        dedupeKey: inAppDedupe,
        correlationId: input.transactionId,
      });
      await markNotificationDeliveryStatus({
        dedupeKey: inAppDedupe,
        recipient: collectorUserId,
        channel: 'IN_APP',
        status: 'SENT',
      });
      inAppSent = true;
    }
  }

  appendAuditEntry({
    actorId: input.actorUserId,
    actorDisplayName: input.actorDisplayName,
    action: 'admin-fee.recorded',
    targetEntityType: 'admin_fee',
    targetEntityId: input.transactionId,
    reason: `Admin fee GHS ${amountGhs} recorded for ${input.borrowerName}${
      input.loanDisplayId ? ` / ${input.loanDisplayId}` : ''
    } on ${paymentDate}.`,
  });

  return { smsSent, emailSent, inAppSent };
}
