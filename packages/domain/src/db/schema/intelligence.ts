import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const exportJobs = pgTable('export_jobs', {
  id: uuid('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  format: text('format').notNull(),
  status: text('status').notNull().default('PENDING'),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  filters: jsonb('filters'),
  rowCount: integer('row_count'),
  fileName: text('file_name'),
  errorMessage: text('error_message'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const alertThresholds = pgTable('alert_thresholds', {
  id: uuid('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  metric: text('metric').notNull(),
  operator: text('operator').notNull().default('gte'),
  thresholdValue: doublePrecision('threshold_value').notNull(),
  severity: text('severity').notNull().default('warning'),
  enabled: boolean('enabled').notNull().default(true),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const earlyWarningEvents = pgTable('early_warning_events', {
  id: uuid('id').primaryKey(),
  thresholdKey: text('threshold_key').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  metricValue: doublePrecision('metric_value'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgedByUserId: uuid('acknowledged_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const operationalIncidents = pgTable('operational_incidents', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  severity: text('severity').notNull().default('warning'),
  status: text('status').notNull().default('OPEN'),
  ownerUserId: uuid('owner_user_id').references(() => users.id),
  summary: text('summary'),
  resolution: text('resolution'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const maintenanceWindows = pgTable('maintenance_windows', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  active: boolean('active').notNull().default(true),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
