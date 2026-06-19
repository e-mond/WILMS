import { Router } from 'express';
import { sendData } from '../../http/response.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  sendData(res, { status: 'ok', service: 'wilms-api' });
});
