import { pgTable, unique, uuid, varchar, text, timestamp, uniqueIndex, foreignKey, jsonb, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const difficulty = pgEnum("difficulty", ['easy', 'medium', 'hard'])


export const academies = pgTable("academies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	logoUrl: varchar("logo_url", { length: 500 }),
	description: text(),
	clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("academies_slug_unique").on(table.slug),
	unique("academies_clerk_user_id_unique").on(table.clerkUserId),
]);

export const students = pgTable("students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	academyId: uuid("academy_id").notNull(),
	username: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("academy_username_idx").using("btree", table.academyId.asc().nullsLast().op("text_ops"), table.username.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academyId],
			foreignColumns: [academies.id],
			name: "students_academy_id_academies_id_fk"
		}),
]);

export const questionsEasy = pgTable("questions_easy", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	question: text().notNull(),
	options: jsonb().notNull(),
	correctOption: integer("correct_option").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const questionsHard = pgTable("questions_hard", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	question: text().notNull(),
	options: jsonb().notNull(),
	correctOption: integer("correct_option").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const questionsMedium = pgTable("questions_medium", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	question: text().notNull(),
	options: jsonb().notNull(),
	correctOption: integer("correct_option").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const exams = pgTable("exams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	academyId: uuid("academy_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	difficulty: difficulty().notNull(),
	totalQuestions: integer("total_questions").notNull(),
	durationMinutes: integer("duration_minutes").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.academyId],
			foreignColumns: [academies.id],
			name: "exams_academy_id_academies_id_fk"
		}),
]);

export const examAttempts = pgTable("exam_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	examId: uuid("exam_id").notNull(),
	studentId: uuid("student_id").notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	score: integer(),
	autoSubmitted: boolean("auto_submitted").default(false),
}, (table) => [
	uniqueIndex("student_exam_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops"), table.examId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unique_submission_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops"), table.examId.asc().nullsLast().op("uuid_ops")).where(sql`(submitted_at IS NOT NULL)`),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "exam_attempts_exam_id_exams_id_fk"
		}),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "exam_attempts_student_id_students_id_fk"
		}),
]);

export const examAnswers = pgTable("exam_answers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attemptId: uuid("attempt_id").notNull(),
	questionId: uuid("question_id").notNull(),
	selectedOption: integer("selected_option").notNull(),
	isCorrect: boolean("is_correct").notNull(),
}, (table) => [
	uniqueIndex("attempt_question_idx").using("btree", table.attemptId.asc().nullsLast().op("uuid_ops"), table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attemptId],
			foreignColumns: [examAttempts.id],
			name: "exam_answers_attempt_id_exam_attempts_id_fk"
		}),
]);
