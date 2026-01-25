/**
 * Simple in-memory data cache to reduce unnecessary network usage.
 * This is NOT persistent storage; it resets on app restart.
 */

interface Exam {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    startTime: string;
    endTime: string;
}

interface ExamAttempt {
    examId: string;
    status: 'active' | 'submitted' | 'expired';
    attemptId: string;
    submittedAt: string | null;
}

interface Question {
    id: string;
    question: string;
    options: string[];
}

interface ExamData {
    examId: string;
    title: string;
    difficulty: string;
    totalQuestions: number;
    durationMinutes: number;
    attemptId: string;
    questions: Question[];
}

let exams: Exam[] | null = null;
let attempts: ExamAttempt[] | null = null;
let questions: Record<string, ExamData> = {};

export const dataCache = {
    // Exams List
    getExams: () => exams,
    setExams: (data: Exam[]) => { exams = data; },
    invalidateExams: () => { exams = null; },

    // Student Attempts
    getAttempts: () => attempts,
    setAttempts: (data: ExamAttempt[]) => { attempts = data; },
    invalidateAttempts: () => { attempts = null; },

    // Exam Questions
    getQuestions: (examId: string) => questions[examId],
    setQuestions: (examId: string, data: ExamData) => { questions[examId] = data; },
    invalidateQuestions: (examId?: string) => {
        if (examId) delete questions[examId];
        else questions = {};
    },

    // Global Clear
    clearAll: () => {
        exams = null;
        attempts = null;
        questions = {};
    }
};
