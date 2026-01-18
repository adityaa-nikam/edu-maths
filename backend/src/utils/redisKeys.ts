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

// Add more key patterns here as we implement them
// Examples for future phases:
// - exam:public:{examId}
// - student:profile:{studentId}
// - exam:attempt:lock:{studentId}:{examId}
