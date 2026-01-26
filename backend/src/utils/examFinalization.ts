/**
 * Exam Finalization Utility
 * 
 * Provides idempotent, reusable logic for finalizing exam attempts.
 * Used by both manual submission and auto-submission paths.
 * 
 * GUARANTEES:
 * - Each attempt finalized exactly once
 * - Safe under concurrent calls (idempotent)
 * - Works with or without Redis
 * - PostgreSQL is the single source of truth
 */

import { db } from '../db/index.js';
import { examAttempts, examAnswers, exams, questionsEasy, questionsMedium, questionsHard } from '../db/schema/index.js';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { markExamAttemptInactive } from './examAttemptHelpers.js';

/**
 * Result of exam finalization operation
 */
export interface FinalizeExamResult {
    success: boolean;
    alreadySubmitted: boolean; // True if attempt was already finalized
    score: number;
    totalQuestions: number;
    percentage: number;
    submittedAt: Date;
    autoSubmitted: boolean;
    error?: string;
}

/**
 * Finalizes an exam attempt by calculating score and marking as submitted.
 * 
 * IDEMPOTENCY GUARANTEE:
 * - If attempt is already submitted, returns existing results without modification
 * - Safe to call multiple times for the same attemptId
 * - Concurrent calls will result in exactly one successful update
 * 
 * @param attemptId - UUID of the exam attempt to finalize
 * @param isAutoSubmit - Whether this is an automatic submission (time expired)
 * @returns FinalizeExamResult with score and submission details
 */
export async function finalizeExamAttempt(
    attemptId: string,
    isAutoSubmit: boolean = false
): Promise<FinalizeExamResult> {
    try {
        // 1. Fetch Attempt and Verify Not Already Submitted (Idempotency Check)
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.id, attemptId))
            .limit(1);

        if (attempt.length === 0) {
            return {
                success: false,
                alreadySubmitted: false,
                score: 0,
                totalQuestions: 0,
                percentage: 0,
                submittedAt: new Date(),
                autoSubmitted: isAutoSubmit,
                error: 'Attempt not found',
            };
        }

        const attemptData = attempt[0];

        // IDEMPOTENCY: If already submitted, return existing results
        if (attemptData.submittedAt !== null) {
            console.log(`✓ Attempt ${attemptId} already finalized at ${attemptData.submittedAt}`);
            return {
                success: true,
                alreadySubmitted: true,
                score: attemptData.score || 0,
                totalQuestions: 0, // We don't recalculate for already-submitted
                percentage: 0,
                submittedAt: attemptData.submittedAt,
                autoSubmitted: attemptData.autoSubmitted || false,
            };
        }

        // 2. Fetch Exam Details
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, attemptData.examId))
            .limit(1);

        if (exam.length === 0) {
            return {
                success: false,
                alreadySubmitted: false,
                score: 0,
                totalQuestions: 0,
                percentage: 0,
                submittedAt: new Date(),
                autoSubmitted: isAutoSubmit,
                error: 'Exam not found',
            };
        }

        const targetExam = exam[0];

        // 3. Fetch All Student's Answers
        const studentAnswers = await db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptId));

        if (studentAnswers.length === 0) {
            // Edge case: No answers saved, submit with score 0
            const now = new Date();
            await db
                .update(examAttempts)
                .set({
                    score: 0,
                    submittedAt: now,
                    autoSubmitted: isAutoSubmit,
                })
                .where(and(
                    eq(examAttempts.id, attemptId),
                    isNull(examAttempts.submittedAt) // Safety: only update if still NULL
                ));

            await markExamAttemptInactive(attemptId);

            return {
                success: true,
                alreadySubmitted: false,
                score: 0,
                totalQuestions: 0,
                percentage: 0,
                submittedAt: now,
                autoSubmitted: isAutoSubmit,
            };
        }

        // 4. Fetch Correct Answers from Question Bank
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
                return {
                    success: false,
                    alreadySubmitted: false,
                    score: 0,
                    totalQuestions: 0,
                    percentage: 0,
                    submittedAt: new Date(),
                    autoSubmitted: isAutoSubmit,
                    error: 'Invalid difficulty level',
                };
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

        // 5. Evaluate Answers and Calculate Score
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

        // 6. Update Exam Attempt with Score and Submission Time
        // CRITICAL: Conditional update ensures idempotency
        const now = new Date();
        const updateResult = await db
            .update(examAttempts)
            .set({
                score,
                submittedAt: now,
                autoSubmitted: isAutoSubmit,
            })
            .where(and(
                eq(examAttempts.id, attemptId),
                isNull(examAttempts.submittedAt) // Only update if NOT already submitted
            ))
            .returning({ id: examAttempts.id });

        // If no rows updated, another process already finalized this attempt
        if (updateResult.length === 0) {
            console.log(`⚠️ Concurrent finalization detected for attempt ${attemptId}, returning existing result`);
            // Re-fetch to get the actual submitted data
            const refetched = await db
                .select()
                .from(examAttempts)
                .where(eq(examAttempts.id, attemptId))
                .limit(1);

            return {
                success: true,
                alreadySubmitted: true,
                score: refetched[0].score || 0,
                totalQuestions: studentAnswers.length,
                percentage: Math.round(((refetched[0].score || 0) / studentAnswers.length) * 100),
                submittedAt: refetched[0].submittedAt!,
                autoSubmitted: refetched[0].autoSubmitted || false,
            };
        }

        // 7. Mark attempt as inactive in Redis
        await markExamAttemptInactive(attemptId);

        // 8. Return Results
        const percentage = Math.round((score / studentAnswers.length) * 100);
        
        console.log(`✅ Exam finalized: attempt=${attemptId}, score=${score}/${studentAnswers.length}, auto=${isAutoSubmit}`);

        return {
            success: true,
            alreadySubmitted: false,
            score,
            totalQuestions: studentAnswers.length,
            percentage,
            submittedAt: now,
            autoSubmitted: isAutoSubmit,
        };

    } catch (error) {
        console.error('Error finalizing exam attempt:', error);
        return {
            success: false,
            alreadySubmitted: false,
            score: 0,
            totalQuestions: 0,
            percentage: 0,
            submittedAt: new Date(),
            autoSubmitted: isAutoSubmit,
            error: 'Failed to finalize exam attempt',
        };
    }
}
