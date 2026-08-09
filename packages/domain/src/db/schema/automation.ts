import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const automationRules = pgTable('automation_rules', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  triggerType: text('trigger_type').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  conditions: jsonb('conditions').notNull().default({}),
  actions: jsonb('actions').notNull().default([]),
  scheduleCron: text('schedule_cron'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const automationRuns = pgTable('automation_runs', {
  id: uuid('id').primaryKey(),
  ruleId: uuid('rule_id').references(() => automationRules.id),
  status: text('status').notNull().default('SUCCEEDED'),
  summary: text('summary'),
  details: jsonb('details'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const automationTasks = pgTable('automation_tasks', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('OPEN'),
  assigneeUserId: uuid('assignee_user_id').references(() => users.id),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: text('related_entity_id'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
