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

// Submit answer for a question
router.post('/:examId/answer', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const { questionId, selectedOption } = req.body;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 1. Validate Input
        if (!questionId || selectedOption === undefined || selectedOption === null) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'questionId and selectedOption are required',
            });
        }

        // Validate selectedOption is a number
        if (typeof selectedOption !== 'number' || selectedOption < 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'selectedOption must be a non-negative number',
            });
        }

        // 2. Verify Exam Exists and Belongs to Student's Academy
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

        if (exam[0].academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Attempt Exists
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
                message: 'You must start the exam before submitting answers',
            });
        }

        const attemptData = attempt[0];
        const targetExam = exam[0];

        // 4. Verify Attempt Not Submitted
        if (attemptData.submittedAt !== null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already been submitted',
            });
        }

        // 5. Check if Exam Duration Has Expired
        const now = new Date();
        const startedAt = new Date(attemptData.startedAt);
        const expiryTime = new Date(startedAt.getTime() + targetExam.durationMinutes * 60 * 1000);

        if (now > expiryTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam time has expired. Please submit the exam.',
            });
        }

        // 6. Verify Question Belongs to Attempt
        const existingAnswer = await db
            .select()
            .from(examAnswers)
            .where(and(
                eq(examAnswers.attemptId, attemptData.id),
                eq(examAnswers.questionId, questionId)
            ))
            .limit(1);

        if (existingAnswer.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Question does not belong to this exam attempt',
            });
        }

        // 7. Update Selected Option (Allow Overwrite)
        await db
            .update(examAnswers)
            .set({
                selectedOption,
            })
            .where(and(
                eq(examAnswers.attemptId, attemptData.id),
                eq(examAnswers.questionId, questionId)
            ));

        return res.status(200).json({
            message: 'Answer saved successfully',
            questionId,
            selectedOption,
        });

    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit answer',
        });
    }
});

// Submit multiple answers at once (batch)
router.post('/:examId/answers', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 1. Validate Input
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'answers array is required and must not be empty',
            });
        }

        // Validate each answer
        for (const answer of answers) {
            if (!answer.questionId || answer.selectedOption === undefined || answer.selectedOption === null) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Each answer must have questionId and selectedOption',
                });
            }

            if (typeof answer.selectedOption !== 'number' || answer.selectedOption < 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'selectedOption must be a non-negative number',
                });
            }
        }

        // 2. Verify Exam Exists and Belongs to Student's Academy
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

        if (exam[0].academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Attempt Exists
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
                message: 'You must start the exam before submitting answers',
            });
        }

        const attemptData = attempt[0];
        const targetExam = exam[0];

        // 4. Verify Attempt Not Submitted
        if (attemptData.submittedAt !== null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already been submitted',
            });
        }

        // 5. Check if Exam Duration Has Expired
        const now = new Date();
        const startedAt = new Date(attemptData.startedAt);
        const expiryTime = new Date(startedAt.getTime() + targetExam.durationMinutes * 60 * 1000);

        if (now > expiryTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam time has expired. Please submit the exam.',
            });
        }

        // 6. Fetch all locked questions for this attempt
        const lockedAnswers = await db
            .select({
                questionId: examAnswers.questionId,
            })
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptData.id));

        const lockedQuestionIds = new Set(lockedAnswers.map(a => a.questionId));

        // 7. Verify all submitted questions belong to this attempt
        for (const answer of answers) {
            if (!lockedQuestionIds.has(answer.questionId)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Question ${answer.questionId} does not belong to this exam attempt`,
                });
            }
        }

        // 8. Update all answers
        let updatedCount = 0;
        for (const answer of answers) {
            await db
                .update(examAnswers)
                .set({
                    selectedOption: answer.selectedOption,
                })
                .where(and(
                    eq(examAnswers.attemptId, attemptData.id),
                    eq(examAnswers.questionId, answer.questionId)
                ));
            updatedCount++;
        }

        return res.status(200).json({
            message: 'Answers saved successfully',
            savedCount: updatedCount,
            totalQuestions: lockedAnswers.length,
        });

    } catch (error) {
        console.error('Error submitting batch answers:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit answers',
        });
    }
});

// Submit exam (final submission with evaluation)
router.post('/:examId/submit', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 1. Verify Exam Exists and Belongs to Student's Academy
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

        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 2. Verify Attempt Exists
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
                message: 'You must start the exam before submitting',
            });
        }

        const attemptData = attempt[0];

        // 3. Verify Not Already Submitted
        if (attemptData.submittedAt !== null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already been submitted',
            });
        }

        // 4. Check if Exam Duration Has Expired (Auto-submit logic)
        const now = new Date();
        const startedAt = new Date(attemptData.startedAt);
        const expiryTime = new Date(startedAt.getTime() + targetExam.durationMinutes * 60 * 1000);
        const isExpired = now > expiryTime;

        // 5. Fetch All Student's Answers
        const studentAnswers = await db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptData.id));

        if (studentAnswers.length === 0) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'No answers found for this attempt',
            });
        }

        // 5. Fetch Correct Answers from Question Bank
        const questionIds = studentAnswers.map(a => a.questionId);

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

        const correctAnswers = await db
            .select({
                id: table.id,
                correctOption: table.correctOption,
            })
            .from(table)
            .where(inArray(table.id, questionIds));

        // Create a map for quick lookup
        const correctAnswersMap = new Map(
            correctAnswers.map(q => [q.id, q.correctOption])
        );

        // 6. Evaluate Answers and Calculate Score
        let score = 0;
        for (const answer of studentAnswers) {
            const correctOption = correctAnswersMap.get(answer.questionId);

            if (correctOption !== undefined) {
                const isCorrect = answer.selectedOption === correctOption;

                // Update the isCorrect field
                await db
                    .update(examAnswers)
                    .set({
                        isCorrect,
                    })
                    .where(eq(examAnswers.id, answer.id));

                if (isCorrect) {
                    score++;
                }
            }
        }

        // 7. Update Exam Attempt with Score and Submission Time
        await db
            .update(examAttempts)
            .set({
                score,
                submittedAt: now,
            })
            .where(eq(examAttempts.id, attemptData.id));

        // 8. Return Results
        return res.status(200).json({
            message: isExpired ? 'Exam auto-submitted (time expired)' : 'Exam submitted successfully',
            score,
            totalQuestions: studentAnswers.length,
            percentage: Math.round((score / studentAnswers.length) * 100),
            submittedAt: now,
            autoSubmitted: isExpired,
        });

    } catch (error) {
        console.error('Error submitting exam:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit exam',
        });
    }
});

// Get exam result
router.get('/:examId/result', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 1. Verify Exam Exists and Belongs to Student's Academy
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

        if (exam[0].academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 2. Verify Attempt Exists
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'You have not attempted this exam',
            });
        }

        const attemptData = attempt[0];

        // 3. Verify Attempt is Submitted
        if (attemptData.submittedAt === null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has not been submitted yet',
            });
        }

        // 4. Get total questions count
        const totalQuestions = await db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptData.id));

        // 5. Return Result
        return res.status(200).json({
            score: attemptData.score,
            totalQuestions: totalQuestions.length,
            percentage: Math.round((attemptData.score! / totalQuestions.length) * 100),
            submittedAt: attemptData.submittedAt,
        });

    } catch (error) {
        console.error('Error fetching exam result:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam result',
        });
    }
});

export default router;
