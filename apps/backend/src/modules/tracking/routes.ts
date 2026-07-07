import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import {
  getTrackingPixel,
  recordEmailClick,
  recordEmailOpen,
} from '../../infrastructure/notifications/email-tracking.js';

export const trackingRouter = Router();

trackingRouter.get(
  '/tracking/pixel/:token',
  asyncHandler(async (req, res) => {
    const token = req.params.token!.replace(/\.gif$/i, '');
    await recordEmailOpen({
      trackingToken: token,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(getTrackingPixel());
  }),
);

trackingRouter.get(
  '/tracking/click/:token/:linkId',
  asyncHandler(async (req, res) => {
    const destination =
      typeof req.query.url === 'string' ? req.query.url : 'https://wilms.vercel.app';
    const redirectUrl = await recordEmailClick({
      trackingToken: req.params.token!,
      linkId: req.params.linkId!,
      destinationUrl: destination,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    res.redirect(302, redirectUrl);
  }),
);
