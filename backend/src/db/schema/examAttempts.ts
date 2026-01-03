import { pgTable, uuid, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { exams } from './exams';
import { students } from './students';

export const examAttempts = pgTable('exam_attempts', {
    id: uuid('id').primaryKey().defaultRandom(),
    examId: uuid('exam_id').notNull().references(() => exams.id),
    studentId: uuid('student_id').notNull().references(() => students.id),
    startedAt: timestamp('started_at').notNull(),
    submittedAt: timestamp('submitted_at'),
    score: integer('score'),
}, (table) => {
    return {
        // Unique constraint: one attempt per student per exam
        studentExamIdx: uniqueIndex('student_exam_idx').on(table.studentId, table.examId),
    };
});

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type NewExamAttempt = typeof examAttempts.$inferInsert;
