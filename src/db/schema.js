import { pgTable, uuid, varchar, text, timestamp, numeric, date, jsonb, integer, index, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('user_role', ['viewer', 'analyst', 'manager', 'admin']);
export const typeEnum = pgEnum('transaction_type', ['income', 'expense']);

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 100 }).notNull(),
  email:     varchar('email', { length: 150 }).notNull().unique(),
  password:  text('password').notNull(),
  role:      roleEnum('role').notNull().default('viewer'),
  status:    varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const financialRecords = pgTable('financial_records', {
  id:        uuid('id').primaryKey().defaultRandom(),
  amount:    numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type:      typeEnum('type').notNull(), 
  category:  varchar('category', { length: 50 }).notNull(),
  date:      date('date').notNull(),
  notes:     text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_active_records').on(table.date).where(sql`deleted_at IS NULL`),
  index('idx_records_type').on(table.type),
  index('idx_records_category').on(table.category),
]);

export const auditLogs = pgTable('audit_logs', {
  id:        uuid('id').primaryKey().defaultRandom(),
  // References the record; set to null if the record is hard-deleted to keep the log
  recordId:  uuid('record_id').references(() => financialRecords.id, { onDelete: 'set null' }),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  action:    varchar('action', { length: 20 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const idempotencyKeys = pgTable('idempotency_keys', {
  key:          text('key').notNull(),
  userId:       uuid('user_id').notNull().references(() => users.id),
  responseCode: integer('response_code').notNull(),
  responseBody: jsonb('response_body').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.key, table.userId] }),
]);