import './config/load-env.js';
import { createApp } from './http/app.js';
import { env } from './config/env.js';
import { isDatabaseEnabled } from './db/client.js';
import { getMailProvider } from './infrastructure/mail/index.js';
import { getSmsProvider } from './infrastructure/sms/index.js';
import { validateUploadEnvironment } from './infrastructure/uploads/index.js';

const app = createApp();

app.listen(env.port, env.host, () => {
  const persistence = isDatabaseEnabled() ? 'postgresql (Neon)' : 'in-memory';
  const uploadReport = validateUploadEnvironment();
  const mailProvider = getMailProvider().name;
  const smsProvider = getSmsProvider().name;

  console.log(`WILMS API listening on http://${env.host}:${env.port} [${persistence}]`);
  console.log(
    `Upload provider: ${uploadReport.activeProvider} (requested: ${uploadReport.provider}) | Mail: ${mailProvider} | SMS: ${smsProvider}`,
  );

  for (const warning of uploadReport.warnings) {
    console.warn(`[uploads] ${warning}`);
  }

  for (const error of uploadReport.errors) {
    console.error(`[uploads] ${error}`);
  }

  if (!uploadReport.valid && env.nodeEnv === 'production') {
    console.error('[uploads] Invalid upload configuration for production — review environment variables.');
  }
});
