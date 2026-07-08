import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { userRoleEnum, userStatusEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  staffId: text('staff_id'),
  phone: text('phone'),
  branch: text('branch'),
  region: text('region'),
  zone: text('zone'),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  profileImageUploadId: uuid('profile_image_upload_id'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  firstLoginAt: timestamp('first_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  sessionVersion: integer('session_version').notNull().default(1),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const collectors = pgTable('collectors', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  collectorCode: text('collector_code').notNull().unique(),
  assignedRegion: text('assigned_region'),
  assignedDistrict: text('assigned_district'),
  employmentStatus: text('employment_status'),
  status: text('status').notNull().default('ACTIVE'),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
