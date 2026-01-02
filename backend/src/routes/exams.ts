import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares';
import { db } from '../db';
import { exams, academies } from '../db/schema';
import { eq, and } from 'drizzle-orm';

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

export default router;
