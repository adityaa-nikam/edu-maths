import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares';
import { db } from '../db';
import { students, academies } from '../db/schema';
import { hashPassword, verifyPassword } from '../utils/password';
import { signStudentToken } from '../utils/jwt';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Create new student
router.post('/create', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { academyId, username, password } = req.body;
        const clerkUserId = req.clerkUserId!;

        // 1. Validate Input
        if (!academyId || !username || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'academyId, username, and password are required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Password must be at least 6 characters long',
            });
        }

        // 2. Validate Academy Ownership
        // Check if the academy exists AND belongs to the authenticated teacher
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
                message: 'You are not authorized to add students to this academy (or it does not exist)',
            });
        }

        // 3. Hash Password
        const passwordHash = await hashPassword(password);

        // 4. Create Student
        // (Drizzle will throw error if username is not unique per academy constraint)
        try {
            const newStudent = await db
                .insert(students)
                .values({
                    academyId,
                    username,
                    passwordHash,
                })
                .returning({
                    id: students.id,
                    username: students.username,
                    academyId: students.academyId,
                    createdAt: students.createdAt,
                });

            return res.status(201).json({
                message: 'Student created successfully',
                student: newStudent[0],
            });

        } catch (dbError: any) {
            // Handle unique constraint violation specifically
            if (dbError.code === '23505') { // Postgres generic duplicate key error code
                return res.status(409).json({
                    error: 'Conflict',
                    message: `Username '${username}' is already taken in this academy`,
                });
            }
            throw dbError; // Re-throw other errors
        }

    } catch (error) {
        console.error('Error creating student:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create student',
        });
    }
});

// Student Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { academySlug, username, password } = req.body;

        // 1. Validate Input
        if (!academySlug || !username || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'academySlug, username, and password are required',
            });
        }

        // 2. Find Academy by Slug
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

        // 3. Find Student in that Academy
        const student = await db
            .select()
            .from(students)
            .where(and(
                eq(students.academyId, targetAcademy.id),
                eq(students.username, username)
            ))
            .limit(1);

        if (student.length === 0) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid username or password',
            });
        }

        const targetStudent = student[0];

        // 4. Verify Password
        const isValid = await verifyPassword(password, targetStudent.passwordHash);

        if (!isValid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid username or password',
            });
        }

        // 5. Generate Token
        const token = signStudentToken({
            studentId: targetStudent.id,
            academyId: targetAcademy.id,
        });

        // 6. Return Response
        return res.status(200).json({
            message: 'Login successful',
            token,
            student: {
                id: targetStudent.id,
                username: targetStudent.username,
                academyId: targetStudent.academyId,
                academyName: targetAcademy.name,
            },
        });

    } catch (error) {
        console.error('Error logging in student:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to login',
        });
    }
});

export default router;
