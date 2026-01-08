import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares';
import { db } from '../db';
import { exams, academies, examAttempts, students } from '../db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

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

        // 3. Parse Query Parameters
        const sortBy = (req.query.sortBy as string) || 'submittedAt';
        const order = (req.query.order as string) || 'desc';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        // Validate sortBy
        const validSortFields = ['score', 'submittedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

        // Validate order
        const sortOrder = order === 'asc' ? asc : desc;

        // Calculate offset
        const offset = (page - 1) * limit;

        // 4. Fetch Total Count
        const totalAttempts = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.examId, examId));

        // 5. Fetch Exam Attempts with Student Details (with sorting and pagination)
        const sortColumn = sortField === 'score' ? examAttempts.score : examAttempts.submittedAt;

        const attempts = await db
            .select({
                studentId: examAttempts.studentId,
                username: students.username,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .innerJoin(students, eq(examAttempts.studentId, students.id))
            .where(eq(examAttempts.examId, examId))
            .orderBy(sortOrder(sortColumn))
            .limit(limit)
            .offset(offset);

        // 6. Return Results
        return res.status(200).json({
            examId,
            examTitle: targetExam.title,
            totalAttempts: totalAttempts.length,
            page,
            limit,
            totalPages: Math.ceil(totalAttempts.length / limit),
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

// Get all exam performances of a student
router.get('/students/:studentId/performance', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 1. Verify Student Exists
        const student = await db
            .select()
            .from(students)
            .where(eq(students.id, studentId))
            .limit(1);

        if (student.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Student not found',
            });
        }

        const targetStudent = student[0];

        // 2. Verify Student Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetStudent.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this student',
            });
        }

        // 3. Parse Query Parameters
        const sortBy = (req.query.sortBy as string) || 'submittedAt';
        const order = (req.query.order as string) || 'desc';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        // Validate sortBy
        const validSortFields = ['score', 'submittedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

        // Validate order
        const sortOrder = order === 'asc' ? asc : desc;

        // Calculate offset
        const offset = (page - 1) * limit;

        // 4. Fetch Total Count
        const totalPerformances = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.studentId, studentId));

        // 5. Fetch Exam Attempts by Student with Exam Details (with sorting and pagination)
        const sortColumn = sortField === 'score' ? examAttempts.score : examAttempts.submittedAt;

        const performances = await db
            .select({
                examId: examAttempts.examId,
                examTitle: exams.title,
                difficulty: exams.difficulty,
                totalQuestions: exams.totalQuestions,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .innerJoin(exams, eq(examAttempts.examId, exams.id))
            .where(eq(examAttempts.studentId, studentId))
            .orderBy(sortOrder(sortColumn))
            .limit(limit)
            .offset(offset);

        // 6. Calculate Overall Statistics (from all performances, not just paginated)
        const allPerformances = await db
            .select({
                score: examAttempts.score,
            })
            .from(examAttempts)
            .where(eq(examAttempts.studentId, studentId));

        const submittedPerformances = allPerformances.filter(p => p.score !== null);

        let totalExamsAttempted = allPerformances.length;
        let totalExamsSubmitted = submittedPerformances.length;
        let averageScore = 0;

        if (submittedPerformances.length > 0) {
            const totalScore = submittedPerformances.reduce((sum, p) => sum + p.score!, 0);
            averageScore = Math.round((totalScore / submittedPerformances.length) * 100) / 100;
        }

        // 7. Return Results
        return res.status(200).json({
            studentId,
            studentUsername: targetStudent.username,
            overallStats: {
                totalExamsAttempted,
                totalExamsSubmitted,
                averageScore,
            },
            page,
            limit,
            totalPages: Math.ceil(totalPerformances.length / limit),
            performances,
        });

    } catch (error) {
        console.error('Error fetching student performance:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch student performance',
        });
    }
});

// Get all exams and their results for an academy (dashboard overview)
router.get('/academy/exams', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId!;

        // 1. Get Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.clerkUserId, clerkUserId))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Academy not found',
            });
        }

        const teacherAcademy = academy[0];

        // 2. Fetch All Exams for Academy
        const allExams = await db
            .select()
            .from(exams)
            .where(eq(exams.academyId, teacherAcademy.id));

        // 3. For Each Exam, Calculate Statistics
        const examResults = await Promise.all(
            allExams.map(async (exam) => {
                // Fetch all attempts for this exam
                const attempts = await db
                    .select({
                        score: examAttempts.score,
                    })
                    .from(examAttempts)
                    .where(eq(examAttempts.examId, exam.id));

                // Filter submitted attempts
                const submittedAttempts = attempts.filter(a => a.score !== null);

                // Calculate average score
                let averageScore = 0;
                if (submittedAttempts.length > 0) {
                    const totalScore = submittedAttempts.reduce((sum, a) => sum + a.score!, 0);
                    averageScore = Math.round((totalScore / submittedAttempts.length) * 100) / 100;
                }

                return {
                    examId: exam.id,
                    title: exam.title,
                    difficulty: exam.difficulty,
                    totalQuestions: exam.totalQuestions,
                    durationMinutes: exam.durationMinutes,
                    startTime: exam.startTime,
                    endTime: exam.endTime,
                    totalAttempts: attempts.length,
                    totalSubmitted: submittedAttempts.length,
                    averageScore,
                };
            })
        );

        // 4. Return Results
        return res.status(200).json({
            academyId: teacherAcademy.id,
            academyName: teacherAcademy.name,
            totalExams: examResults.length,
            exams: examResults,
        });

    } catch (error) {
        console.error('Error fetching academy exams:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch academy exams',
        });
    }
});

export default router;
