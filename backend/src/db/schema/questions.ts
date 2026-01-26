import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

const commonColumns = {
    id: uuid('id').primaryKey().defaultRandom(),
    question: text('question').notNull(),
    options: jsonb('options').notNull(), // Array of strings e.g. ["10", "20", "30", "40"]
    correctOption: integer('correct_option').notNull(), // Index of correct option (0-3)
    createdAt: timestamp('created_at').defaultNow().notNull(),
};

export const questionsEasy = pgTable('questions_easy', {
    ...commonColumns,
});

export const questionsMedium = pgTable('questions_medium', {
    ...commonColumns,
});

export const questionsHard = pgTable('questions_hard', {
    ...commonColumns,
});

export type QuestionEasy = typeof questionsEasy.$inferSelect;
export type QuestionMedium = typeof questionsMedium.$inferSelect;
export type QuestionHard = typeof questionsHard.$inferSelect;

export type NewQuestionEasy = typeof questionsEasy.$inferInsert;
export type NewQuestionMedium = typeof questionsMedium.$inferInsert;
export type NewQuestionHard = typeof questionsHard.$inferInsert;
