import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";

export const xpUsers = pgTable('xp_users', {
  // Using text for ID allows potentially using CUIDs or other string IDs later
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), // Auto-generate UUID
  address: text('address').notNull().unique(),
  xp: integer('xp').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const xpLogs = pgTable('xp_logs', {
  id: serial('id').primaryKey(),
  // Reference the user's ID from xpUsers table
  userId: text('user_id').notNull().references(() => xpUsers.id, { onDelete: 'cascade' }),
  source: text('source').notNull(), // e.g., 'mission_1', 'sigma_hint_3'
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}); 