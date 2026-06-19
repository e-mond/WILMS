import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uploadPurposeEnum } from './enums';
import { users } from './users';

export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey(),
  purpose: uploadPurposeEnum('purpose').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageKey: text('storage_key').notNull(),
  url: text('url'),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  ownerUserId: uuid('owner_user_id').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
