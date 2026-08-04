import '../../config/load-env.js';
import { getSettings, sendTestEmail, sendTestSms } from '../modules/settings/service.js';

async function main(): Promise<void> {
  const settings = await getSettings();
  const testUserId = process.env.WILMS_SMOKE_USER_ID?.trim();
  const phone = process.env.WILMS_SMOKE_SMS_PHONE?.trim();
  const email = process.env.WILMS_SMOKE_EMAIL?.trim();

  console.log(
    JSON.stringify(
      {
        smsNotificationsEnabled: settings.smsNotificationsEnabled,
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        missedPaymentSmsEnabled: settings.missedPaymentSmsEnabled,
        approvalSmsEnabled: settings.approvalSmsEnabled,
      },
      null,
      2,
    ),
  );

  if (!testUserId) {
    console.log('Set WILMS_SMOKE_USER_ID to exercise live test SMS/email endpoints.');
    return;
  }

  if (phone) {
    await sendTestSms(testUserId, phone);
    console.log('Test SMS sent.');
  }

  if (email) {
    await sendTestEmail(testUserId, email);
    console.log('Test email sent.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
