ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'PASSWORD_CHANGED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'INVITATION_ACCEPTED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'LOGIN_ALERT';
