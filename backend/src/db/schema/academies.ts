import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const academies = pgTable('academies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logoUrl: varchar('logo_url', { length: 500 }),
  description: text('description'),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Academy = typeof academies.$inferSelect;
export type NewAcademy = typeof academies.$inferInsert;
