import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const rsvps = pgTable('rsvps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  attending: boolean('attending').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
