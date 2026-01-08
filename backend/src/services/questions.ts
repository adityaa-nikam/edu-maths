import { db } from '../db';
import { questionsEasy, questionsMedium, questionsHard } from '../db/schema';
import { sql } from 'drizzle-orm';

interface Question {
    id: string;
    question: string;
    options: any; // jsonb
}

/**
 * Fetch random questions from the question bank
 * @param difficulty - easy | medium | hard
 * @param totalQuestions - number of questions to fetch
 * @returns Array of questions WITHOUT correct_option
 */
export const fetchRandomQuestions = async (
    difficulty: 'easy' | 'medium' | 'hard',
    totalQuestions: number
): Promise<Question[]> => {
    // Select the appropriate table based on difficulty
    let table;
    switch (difficulty) {
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
            throw new Error('Invalid difficulty level');
    }

    // Fetch random questions using PostgreSQL's RANDOM()
    const questions = await db
        .select({
            id: table.id,
            question: table.question,
            options: table.options,
        })
        .from(table)
        .orderBy(sql`RANDOM()`)
        .limit(totalQuestions);

    return questions;
};
