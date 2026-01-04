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

export default router;
