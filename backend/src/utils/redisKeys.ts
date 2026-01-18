/**
 * Redis Key Patterns
 * 
 * Centralized documentation of all Redis keys used in the application.
 * Follow these patterns consistently to avoid key conflicts.
 */

/**
 * Academy cache keys
 * 
 * Pattern: academy:public:{slug}
 * TTL: 300 seconds (5 minutes)
 * Usage: Cache public academy information
 * Invalidation: On academy create/update
 * 
 * @param slug - Academy slug identifier
 * @returns Redis key string
 */
export const getAcademyPublicKey = (slug: string): string => {
  return `academy:public:${slug}`;
};

/**
 * Academy exams list cache keys
 * 
 * Pattern: academy:exams:{academySlug}
 * TTL: 60 seconds (1 minute)
 * Usage: Cache public exam listings for an academy
 * Invalidation: On exam create/update/delete for that academy
 * 
 * @param academySlug - Academy slug identifier
 * @returns Redis key string
 */
export const getAcademyExamsKey = (academySlug: string): string => {
  return `academy:exams:${academySlug}`;
};

/**
 * Exam start lock keys
 * 
 * Pattern: exam:start:{examId}:{studentId}
 * TTL: 10 seconds
 * Usage: Prevent concurrent exam start attempts
 * Purpose: Concurrency control during exam attempt creation
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getExamStartLockKey = (examId: string, studentId: string): string => {
  return `exam:start:${examId}:${studentId}`;
};

// Add more key patterns here as we implement them
// Examples for future phases:
// - exam:public:{examId}
// - student:profile:{studentId}
// - exam:attempt:lock:{studentId}:{examId}
