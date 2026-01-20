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

/**
 * Exam attempt active state keys
 * 
 * Pattern: exam:attempt:active:{attemptId}
 * TTL: Dynamic - expires exactly at global exam end time
 * Usage: Fast server-side check if exam attempt is still active
 * Purpose: Avoid repeated DB queries and time calculations
 * 
 * Key existence = attempt is active
 * Key absence = attempt is over (time expired or submitted)
 * 
 * @param attemptId - Exam attempt UUID
 * @returns Redis key string
 */
export const getExamAttemptActiveKey = (attemptId: string): string => {
  return `exam:attempt:active:${attemptId}`;
};

/**
 * Rate limit keys for answer submissions
 * 
 * Pattern: ratelimit:answer:{examId}:{studentId}
 * TTL: 1 second
 * Usage: Track answer submission rate per student per exam
 * Purpose: Prevent answer spamming and retry storms
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getRateLimitAnswerKey = (examId: string, studentId: string): string => {
  return `ratelimit:answer:${examId}:${studentId}`;
};

/**
 * Rate limit keys for exam submission
 * 
 * Pattern: ratelimit:submit:{examId}:{studentId}
 * TTL: 60 seconds
 * Usage: Track exam submit attempts per student per exam
 * Purpose: Prevent submit retry storms and malicious rapid-fire requests
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getRateLimitSubmitKey = (examId: string, studentId: string): string => {
  return `ratelimit:submit:${examId}:${studentId}`;
};

// Add more key patterns here as we implement them
// Examples for future phases:
// - exam:public:{examId}
// - student:profile:{studentId}
// - exam:attempt:lock:{studentId}:{examId}
