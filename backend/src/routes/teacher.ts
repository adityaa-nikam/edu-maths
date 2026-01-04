import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares';
import { db } from '../db';
import { exams, academies, examAttempts, students } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all attempts for a given exam
router.get('/exams/:examId/attempts', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const clerkUserId = req.clerkUserId!;

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

        // 2. Verify Exam Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetExam.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this exam',
            });
        }

        // 3. Fetch All Exam Attempts with Student Details
        const attempts = await db
            .select({
                studentId: examAttempts.studentId,
                username: students.username,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .innerJoin(students, eq(examAttempts.studentId, students.id))
            .where(eq(examAttempts.examId, examId));

        // 4. Return Results
        return res.status(200).json({
            examId,
            examTitle: targetExam.title,
            totalAttempts: attempts.length,
            attempts,
        });

    } catch (error) {
        console.error('Error fetching exam attempts:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam attempts',
        });
    }
});

// Get summary of an exam
router.get('/exams/:examId/summary', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const clerkUserId = req.clerkUserId!;

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

        // 2. Verify Exam Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetExam.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this exam',
            });
        }

        // 3. Fetch All Submitted Exam Attempts (only submitted ones have scores)
        const attempts = await db
            .select({
                score: examAttempts.score,
            })
            .from(examAttempts)
            .where(eq(examAttempts.examId, examId));

        // Filter only submitted attempts (those with non-null scores)
        const submittedAttempts = attempts.filter(a => a.score !== null);

        // 4. Calculate Summary Statistics
        let averageScore = 0;
        let highestScore = 0;
        let lowestScore = 0;

        if (submittedAttempts.length > 0) {
            const scores = submittedAttempts.map(a => a.score!);

            // Calculate average
            const totalScore = scores.reduce((sum, score) => sum + score, 0);
            averageScore = Math.round((totalScore / scores.length) * 100) / 100; // Round to 2 decimal places

            // Find highest and lowest
            highestScore = Math.max(...scores);
            lowestScore = Math.min(...scores);
        }

        // 5. Return Summary
        return res.status(200).json({
            examId,
            examTitle: targetExam.title,
            totalQuestions: targetExam.totalQuestions,
            difficulty: targetExam.difficulty,
            summary: {
                totalStudentsAttempted: attempts.length,
                totalStudentsSubmitted: submittedAttempts.length,
                averageScore,
                highestScore,
                lowestScore,
            },
        });

    } catch (error) {
        console.error('Error fetching exam summary:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam summary',
        });
    }
});

export default router;
