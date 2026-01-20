import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { exams, academies, examAttempts, students, examAnswers, questionsEasy, questionsMedium, questionsHard } from '../db/schema/index.js';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { cache } from '../utils/cache.js';
import { getTeacherAcademyExamsKey, getTeacherAcademyStudentsKey } from '../utils/redisKeys.js';
import { logger } from '../utils/logger.js';

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
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

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

        // CACHE: Check if data is cached (with pagination in key)
        const cacheKey = `${getTeacherAcademyExamsKey(teacherAcademy.id)}:page:${page}:limit:${limit}`;
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for teacher academy exams', {
                requestId: req.requestId,
                academyId: teacherAcademy.id,
                page,
                limit,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 2. Fetch Total Count of Exams
        const allExams = await db
            .select()
            .from(exams)
            .where(eq(exams.academyId, teacherAcademy.id));

        // 3. Fetch Paginated Exams for Academy (sorted by createdAt DESC - latest first)
        const paginatedExams = await db
            .select()
            .from(exams)
            .where(eq(exams.academyId, teacherAcademy.id))
            .orderBy(desc(exams.createdAt))
            .limit(limit)
            .offset(offset);

        // 4. Fetch All Attempts in ONE Query (batched)
        const examIds = paginatedExams.map(e => e.id);

        const allAttempts = await db
            .select({
                examId: examAttempts.examId,
                score: examAttempts.score,
            })
            .from(examAttempts)
            .where(inArray(examAttempts.examId, examIds));

        // Group attempts by examId
        const attemptsByExam = allAttempts.reduce((acc, attempt) => {
            if (!acc[attempt.examId]) {
                acc[attempt.examId] = [];
            }
            acc[attempt.examId].push(attempt);
            return acc;
        }, {} as Record<string, typeof allAttempts>);

        // 5. Calculate Statistics for Each Exam
        const examResults = paginatedExams.map((exam) => {
            const attempts = attemptsByExam[exam.id] || [];
            const submittedAttempts = attempts.filter(a => a.score !== null);

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
                createdAt: exam.createdAt,
                totalAttempts: attempts.length,
                totalSubmitted: submittedAttempts.length,
                averageScore,
            };
        });

        // 6. Prepare Response
        const responseData = {
            academyId: teacherAcademy.id,
            academyName: teacherAcademy.name,
            totalExams: allExams.length,
            exams: examResults,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(allExams.length / limit),
                totalItems: allExams.length,
                itemsPerPage: limit,
            },
        };

        // CACHE: Store the result for 60 seconds
        await cache.set(cacheKey, responseData, 60);
        
        logger.info('Cache miss - data fetched from DB and cached', {
            requestId: req.requestId,
            academyId: teacherAcademy.id,
            page,
            limit,
            cacheKey,
            ttl: 60,
        });

        // 7. Return Results with Pagination
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching academy exams:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch academy exams',
        });
    }
});

// Get all students for teacher's academy
router.get('/academy/students', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId!;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // 1. Get Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.clerkUserId, clerkUserId))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No academy found for this teacher',
            });
        }

        const teacherAcademy = academy[0];

        // CACHE: Check if data is cached (with pagination in key)
        const cacheKey = `${getTeacherAcademyStudentsKey(teacherAcademy.id)}:page:${page}:limit:${limit}`;
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for teacher academy students', {
                requestId: req.requestId,
                academyId: teacherAcademy.id,
                page,
                limit,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 2. Fetch Total Count of Students
        const totalStudents = await db
            .select()
            .from(students)
            .where(eq(students.academyId, teacherAcademy.id));

        // 3. Fetch Paginated Students for Academy (sorted by createdAt DESC - newest first)
        const paginatedStudents = await db
            .select({
                id: students.id,
                username: students.username,
                createdAt: students.createdAt,
            })
            .from(students)
            .where(eq(students.academyId, teacherAcademy.id))
            .orderBy(desc(students.createdAt))
            .limit(limit)
            .offset(offset);

        // 4. Prepare Response
        const responseData = {
            academyId: teacherAcademy.id,
            academyName: teacherAcademy.name,
            totalStudents: totalStudents.length,
            students: paginatedStudents,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalStudents.length / limit),
                totalItems: totalStudents.length,
                itemsPerPage: limit,
            },
        };

        // CACHE: Store the result for 60 seconds
        await cache.set(cacheKey, responseData, 60);
        
        logger.info('Cache miss - data fetched from DB and cached', {
            requestId: req.requestId,
            academyId: teacherAcademy.id,
            page,
            limit,
            cacheKey,
            ttl: 60,
        });

        // 5. Return Results with Pagination
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching academy students:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch academy students',
        });
    }
});

// Get detailed exam results for a specific student (question-by-question)
router.get('/exams/:examId/student/:studentId', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { examId, studentId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 1. Verify Exam Exists and Belongs to Teacher's Academy
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

        // 2. Verify Student Belongs to Academy
        const student = await db
            .select()
            .from(students)
            .where(and(
                eq(students.id, studentId),
                eq(students.academyId, targetExam.academyId)
            ))
            .limit(1);

        if (student.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Student not found in this academy',
            });
        }

        const targetStudent = student[0];

        // 3. Get Student's Attempt
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
                message: 'Student has not attempted this exam',
            });
        }

        const studentAttempt = attempt[0];

        // 4. Get All Answers for This Attempt
        const answers = await db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, studentAttempt.id));

        if (answers.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No answers found for this attempt',
            });
        }

        // 5. Get Question Details Based on Difficulty
        let questionsTable;
        if (targetExam.difficulty === 'easy') {
            questionsTable = questionsEasy;
        } else if (targetExam.difficulty === 'medium') {
            questionsTable = questionsMedium;
        } else {
            questionsTable = questionsHard;
        }

        // Extract question IDs
        const questionIds = answers.map(a => a.questionId);

        // Fetch question details
        const questionDetails = await db
            .select()
            .from(questionsTable)
            .where(inArray(questionsTable.id, questionIds));

        // 6. Combine Answers with Question Details
        const questionsWithAnswers = answers.map(answer => {
            const question = questionDetails.find(q => q.id === answer.questionId);
            return {
                questionId: answer.questionId,
                question: question?.question || 'Question not found',
                options: question?.options || [],
                correctAnswer: question?.correctOption || 0,
                selectedOption: answer.selectedOption,
                isCorrect: answer.isCorrect,
            };
        });

        // 7. Return Results
        return res.status(200).json({
            student: {
                id: targetStudent.id,
                username: targetStudent.username,
            },
            exam: {
                id: targetExam.id,
                title: targetExam.title,
                difficulty: targetExam.difficulty,
                totalQuestions: targetExam.totalQuestions,
            },
            attempt: {
                id: studentAttempt.id,
                startedAt: studentAttempt.startedAt,
                submittedAt: studentAttempt.submittedAt,
                score: studentAttempt.score,
            },
            questions: questionsWithAnswers,
        });

    } catch (error) {
        console.error('Error fetching student exam details:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch student exam details',
        });
    }
});

// Get all students performance summary for teacher's academy
router.get('/academy/:academyId/students-performance', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { academyId } = req.params;
        const clerkUserId = req.clerkUserId!;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // 1. Verify academy ownership
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
                message: 'You do not own this academy',
            });
        }

        // 2. Get total count of students in this academy
        const allStudents = await db
            .select({
                studentId: students.id,
                username: students.username,
                createdAt: students.createdAt,
            })
            .from(students)
            .where(eq(students.academyId, academyId));

        // 3. Get paginated students (sorted by username)
        const paginatedStudents = await db
            .select({
                studentId: students.id,
                username: students.username,
                createdAt: students.createdAt,
            })
            .from(students)
            .where(eq(students.academyId, academyId))
            .orderBy(asc(students.username))
            .limit(limit)
            .offset(offset);

        // 4. Fetch All Performances in ONE Query (batched)
        const studentIds = paginatedStudents.map(s => s.studentId);

        const allPerformances = await db
            .select({
                studentId: examAttempts.studentId,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .where(inArray(examAttempts.studentId, studentIds));

        // Group performances by studentId
        const performancesByStudent = allPerformances.reduce((acc, perf) => {
            if (!acc[perf.studentId]) {
                acc[perf.studentId] = [];
            }
            acc[perf.studentId].push(perf);
            return acc;
        }, {} as Record<string, typeof allPerformances>);

        // 5. Calculate Statistics for Each Student
        const studentsWithStats = paginatedStudents.map((student) => {
            const performances = performancesByStudent[student.studentId] || [];
            const submitted = performances.filter(p => p.submittedAt !== null);
            const totalAttempted = performances.length;
            const totalSubmitted = submitted.length;
            let avgScore = 0;

            if (submitted.length > 0) {
                const total = submitted.reduce((sum, p) => sum + (p.score || 0), 0);
                avgScore = Math.round((total / submitted.length) * 100) / 100;
            }

            return {
                studentId: student.studentId,
                username: student.username,
                joinedAt: student.createdAt,
                totalExamsAttempted: totalAttempted,
                totalExamsSubmitted: totalSubmitted,
                averageScore: avgScore,
            };
        });

        return res.status(200).json({
            academy: {
                id: academy[0].id,
                name: academy[0].name,
            },
            students: studentsWithStats,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(allStudents.length / limit),
                totalItems: allStudents.length,
                itemsPerPage: limit,
            },
        });

    } catch (error) {
        console.error('Error fetching students performance:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch students performance',
        });
    }
});

// Delete a student
router.delete('/students/:studentId', authenticateTeacher, async (req: Request, res: Response) => {
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
                message: 'You are not authorized to delete this student',
            });
        }

        // 3. Check if student has any exam attempts
        const attempts = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.studentId, studentId))
            .limit(1);

        if (attempts.length > 0) {
            // Student has exam history - don't allow deletion for data integrity
            return res.status(409).json({
                error: 'Conflict',
                message: 'Cannot delete student with exam history. Student has taken exams.',
                details: 'This student has attempted exams. Deleting would break exam records.',
            });
        }

        // 4. Delete the student (no exam history)
        await db
            .delete(students)
            .where(eq(students.id, studentId));

        return res.status(200).json({
            success: true,
            message: 'Student deleted successfully',
            deletedStudent: {
                id: targetStudent.id,
                username: targetStudent.username,
            },
        });

    } catch (error) {
        console.error('Error deleting student:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete student',
        });
    }
});

export default router;
