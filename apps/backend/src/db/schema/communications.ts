import { boolean, jsonb, pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const communicationTemplates = pgTable('communication_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  channels: text('channels').array().notNull().default([]),
  isSystem: boolean('is_system').notNull().default(false),
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communicationMessages = pgTable('communication_messages', {
  id: text('id').primaryKey(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  channels: text('channels').array().notNull().default([]),
  status: text('status').notNull().default('DRAFT'),
  audienceType: text('audience_type').notNull(),
  audienceFilter: jsonb('audience_filter'),
  recipientCount: integer('recipient_count').notNull().default(0),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  templateId: text('template_id'),
  createdByUserId: text('created_by_user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
