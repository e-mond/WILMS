import './config/load-env.js';
import { createApp } from './http/app.js';
import { env } from './config/env.js';
import { isDatabaseEnabled } from './db/client.js';
import { getMailProvider } from './infrastructure/mail/index.js';
import { getSmsProvider } from './infrastructure/sms/index.js';
import { getUploadConfig, isCloudinaryConfigured } from './infrastructure/uploads/index.js';

const app = createApp();

app.listen(env.port, env.host, () => {
  const persistence = isDatabaseEnabled() ? 'postgresql (Neon)' : 'in-memory';
  const uploadConfig = getUploadConfig();
  const uploadMode =
    uploadConfig.provider === 'cloudinary' && isCloudinaryConfigured()
      ? 'cloudinary'
      : 'local';
  const mailProvider = getMailProvider().name;
  const smsProvider = getSmsProvider().name;

  console.log(`WILMS API listening on http://${env.host}:${env.port} [${persistence}]`);
  console.log(`Upload provider: ${uploadMode} | Mail: ${mailProvider} | SMS: ${smsProvider}`);
});
