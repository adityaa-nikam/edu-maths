import { relations } from "drizzle-orm/relations";
import { academies, students, exams, examAttempts, examAnswers } from "./schema";

export const studentsRelations = relations(students, ({one, many}) => ({
	academy: one(academies, {
		fields: [students.academyId],
		references: [academies.id]
	}),
	examAttempts: many(examAttempts),
}));

export const academiesRelations = relations(academies, ({many}) => ({
	students: many(students),
	exams: many(exams),
}));

export const examsRelations = relations(exams, ({one, many}) => ({
	academy: one(academies, {
		fields: [exams.academyId],
		references: [academies.id]
	}),
	examAttempts: many(examAttempts),
}));

export const examAttemptsRelations = relations(examAttempts, ({one, many}) => ({
	exam: one(exams, {
		fields: [examAttempts.examId],
		references: [exams.id]
	}),
	student: one(students, {
		fields: [examAttempts.studentId],
		references: [students.id]
	}),
	examAnswers: many(examAnswers),
}));

export const examAnswersRelations = relations(examAnswers, ({one}) => ({
	examAttempt: one(examAttempts, {
		fields: [examAnswers.attemptId],
		references: [examAttempts.id]
	}),
}));