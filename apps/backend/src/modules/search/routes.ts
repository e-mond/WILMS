import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import * as searchService from './service.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    sendData(
      res,
      await searchService.globalSearch({
        query: String(req.query.q ?? ''),
        role: String(req.query.role ?? ''),
        limit: Number.isFinite(limit) ? limit : undefined,
      }),
    );
  }),
);
