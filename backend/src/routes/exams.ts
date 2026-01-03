import { Router, Request, Response } from 'express';
import { authenticateTeacher, authenticateStudent } from '../middlewares';
import { db } from '../db';
import { exams, academies, examAttempts, examAnswers, questionsEasy, questionsMedium, questionsHard } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { fetchRandomQuestions } from '../services/questions';

const router = Router();

// Create exam
router.post('/create', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { academyId, title, difficulty, totalQuestions, durationMinutes, startTime } = req.body;
        const clerkUserId = req.clerkUserId!;

        // 1. Validate Input
        if (!academyId || !title || !difficulty || !totalQuestions || !durationMinutes || !startTime) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'All fields are required: academyId, title, difficulty, totalQuestions, durationMinutes, startTime',
            });
        }

        // Validate difficulty enum
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Difficulty must be one of: easy, medium, hard',
            });
        }

        // Validate numeric fields
        if (totalQuestions <= 0 || durationMinutes <= 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'totalQuestions and durationMinutes must be positive numbers',
            });
        }

        // 2. Validate Academy Ownership
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to create exams for this academy',
            });
        }

        // 3. Calculate End Time
        const startTimeDate = new Date(startTime);
        const endTimeDate = new Date(startTimeDate.getTime() + durationMinutes * 60 * 1000);

        // 4. Create Exam
        const newExam = await db
            .insert(exams)
            .values({
                academyId,
                title,
                difficulty,
                totalQuestions,
                durationMinutes,
                startTime: startTimeDate,
                endTime: endTimeDate,
            })
            .returning({
                id: exams.id,
                title: exams.title,
                difficulty: exams.difficulty,
                totalQuestions: exams.totalQuestions,
                durationMinutes: exams.durationMinutes,
                startTime: exams.startTime,
                endTime: exams.endTime,
                createdAt: exams.createdAt,
            });

        return res.status(201).json({
            message: 'Exam created successfully',
            exam: newExam[0],
        });

    } catch (error) {
        console.error('Error creating exam:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create exam',
        });
    }
});

// Get all exams for an academy (public)
router.get('/academy/:academySlug', async (req: Request, res: Response) => {
    try {
        const { academySlug } = req.params;

        // 1. Find Academy by Slug
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.slug, academySlug))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Academy not found',
            });
        }

        const targetAcademy = academy[0];

        // 2. Fetch All Exams for this Academy
        const academyExams = await db
            .select({
                id: exams.id,
                title: exams.title,
                difficulty: exams.difficulty,
                startTime: exams.startTime,
                endTime: exams.endTime,
            })
            .from(exams)
            .where(eq(exams.academyId, targetAcademy.id));

        return res.status(200).json({
            academy: {
                name: targetAcademy.name,
                slug: targetAcademy.slug,
            },
            exams: academyExams,
        });

    } catch (error) {
        console.error('Error fetching exams:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exams',
        });
    }
});

// Check exam status for student
router.get('/:examId/status', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentAcademyId = req.academyId!;

        // 1. Fetch Exam
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        // 2. Verify Exam Belongs to Student's Academy
        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Determine Exam Status
        const now = new Date();
        const startTime = new Date(targetExam.startTime);
        const endTime = new Date(targetExam.endTime);

        let status: 'not_started' | 'active' | 'expired';

        if (now < startTime) {
            status = 'not_started';
        } else if (now >= startTime && now <= endTime) {
            status = 'active';
        } else {
            status = 'expired';
        }

        return res.status(200).json({
            examId: targetExam.id,
            title: targetExam.title,
            difficulty: targetExam.difficulty,
            startTime: targetExam.startTime,
            endTime: targetExam.endTime,
            status,
        });

    } catch (error) {
        console.error('Error checking exam status:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check exam status',
        });
    }
});

// Start exam attempt
router.post('/:examId/start', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 1. Verify Exam Exists
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        // 2. Verify Exam Belongs to Student's Academy
        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Exam is Active (current time within window)
        const now = new Date();
        const startTime = new Date(targetExam.startTime);
        const endTime = new Date(targetExam.endTime);

        if (now < startTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has not started yet',
            });
        }

        if (now > endTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already ended',
            });
        }

        // 4. Verify Student Has Not Attempted Exam Before
        const existingAttempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (existingAttempt.length > 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You have already attempted this exam',
            });
        }

        // 5. Fetch Random Questions and Lock Them
        const randomQuestions = await fetchRandomQuestions(
            targetExam.difficulty,
            targetExam.totalQuestions
        );

        // 6. Create Exam Attempt Entry
        const newAttempt = await db
            .insert(examAttempts)
            .values({
                examId,
                studentId,
                startedAt: now,
            })
            .returning({
                id: examAttempts.id,
                startedAt: examAttempts.startedAt,
            });

        const attemptId = newAttempt[0].id;

        // 7. Pre-create exam_answers rows to lock questions
        // This ensures the student always gets the same questions for this attempt
        const examAnswerRows = randomQuestions.map(q => ({
            attemptId,
            questionId: q.id,
            selectedOption: 0, // Placeholder - will be updated on submission
            isCorrect: false,  // Placeholder - will be updated on submission
        }));

        await db.insert(examAnswers).values(examAnswerRows);

        // 8. Return Attempt Details
        return res.status(201).json({
            message: 'Exam attempt started successfully',
            attemptId,
            durationMinutes: targetExam.durationMinutes,
            serverStartTime: newAttempt[0].startedAt,
        });

    } catch (error) {
        console.error('Error starting exam attempt:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to start exam attempt',
        });
    }
});

// Get exam questions (student)
router.get('/:examId/questions', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 1. Fetch Exam
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        // 2. Verify Exam Belongs to Student's Academy
        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Exam is Active
        const now = new Date();
        const startTime = new Date(targetExam.startTime);
        const endTime = new Date(targetExam.endTime);

        if (now < startTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has not started yet',
            });
        }

        if (now > endTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already ended',
            });
        }

        // 4. Find Student's Attempt for This Exam
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You must start the exam before accessing questions',
            });
        }

        const attemptId = attempt[0].id;

        // 5. Fetch Locked Question IDs from exam_answers
        const lockedAnswers = await db
            .select({
                questionId: examAnswers.questionId,
            })
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptId));

        if (lockedAnswers.length === 0) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'No questions found for this attempt',
            });
        }

        const questionIds = lockedAnswers.map(a => a.questionId);

        // 6. Fetch Question Details (WITHOUT correct_option)
        // Select the appropriate table based on difficulty
        let table;
        switch (targetExam.difficulty) {
            case 'easy':
                table = questionsEasy;
                break;
            case 'medium':
                table = questionsMedium;
                break;
            case 'hard':
                table = questionsHard;
                break;
            default:
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Invalid difficulty level',
                });
        }

        const questions = await db
            .select({
                id: table.id,
                question: table.question,
                options: table.options,
            })
            .from(table)
            .where(inArray(table.id, questionIds));

        return res.status(200).json({
            examId: targetExam.id,
            title: targetExam.title,
            difficulty: targetExam.difficulty,
            totalQuestions: targetExam.totalQuestions,
            durationMinutes: targetExam.durationMinutes,
            attemptId,
            questions,
        });

    } catch (error) {
        console.error('Error fetching exam questions:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam questions',
        });
    }
});

export default router;
