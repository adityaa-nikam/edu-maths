/**
 * Browser Storage Utility for Exam Answers
 * Stores selected answers in localStorage for instant access and recovery
 */

const STORAGE_PREFIX = 'exam_';
const ANSWER_SUFFIX = '_answers';
const METADATA_SUFFIX = '_metadata';

/**
 * Generate storage key for exam answers
 */
const getAnswersKey = (examId) => `${STORAGE_PREFIX}${examId}${ANSWER_SUFFIX}`;

/**
 * Generate storage key for exam metadata
 */
const getMetadataKey = (examId) => `${STORAGE_PREFIX}${examId}${METADATA_SUFFIX}`;

/**
 * Save a single answer to localStorage
 * @param {string} examId - The exam ID
 * @param {string} questionId - The question ID
 * @param {number} selectedOption - The selected option index (0-3)
 */
export const saveAnswerToCache = (examId, questionId, selectedOption) => {
    try {
        const storageKey = getAnswersKey(examId);
        const existingAnswers = loadAnswersFromCache(examId);
        
        existingAnswers[questionId] = {
            selectedOption,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(existingAnswers));
        
        // Update metadata
        updateMetadata(examId);
        
        return true;
    } catch (error) {
        console.error('Error saving answer to cache:', error);
        return false;
    }
};

/**
 * Save multiple answers to localStorage (batch save)
 * @param {string} examId - The exam ID
 * @param {Object} answersObj - Object with questionId as key and selectedOption as value
 */
export const saveAllAnswersToCache = (examId, answersObj) => {
    try {
        const storageKey = getAnswersKey(examId);
        const cachedAnswers = {};
        
        Object.entries(answersObj).forEach(([questionId, selectedOption]) => {
            cachedAnswers[questionId] = {
                selectedOption,
                timestamp: new Date().toISOString()
            };
        });
        
        localStorage.setItem(storageKey, JSON.stringify(cachedAnswers));
        updateMetadata(examId);
        
        return true;
    } catch (error) {
        console.error('Error saving all answers to cache:', error);
        return false;
    }
};

/**
 * Load all answers from localStorage for a specific exam
 * @param {string} examId - The exam ID
 * @returns {Object} Object with questionId as key and answer data as value
 */
export const loadAnswersFromCache = (examId) => {
    try {
        const storageKey = getAnswersKey(examId);
        const data = localStorage.getItem(storageKey);
        
        if (!data) {
            return {};
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading answers from cache:', error);
        return {};
    }
};

/**
 * Get only the selected options (without metadata) in simple format
 * @param {string} examId - The exam ID
 * @returns {Object} Object with questionId as key and selectedOption as value
 */
export const getSimpleAnswers = (examId) => {
    try {
        const cachedAnswers = loadAnswersFromCache(examId);
        const simpleAnswers = {};
        
        Object.entries(cachedAnswers).forEach(([questionId, data]) => {
            simpleAnswers[questionId] = data.selectedOption;
        });
        
        return simpleAnswers;
    } catch (error) {
        console.error('Error getting simple answers:', error);
        return {};
    }
};

/**
 * Clear all answers for a specific exam
 * @param {string} examId - The exam ID
 */
export const clearExamCache = (examId) => {
    try {
        const answersKey = getAnswersKey(examId);
        const metadataKey = getMetadataKey(examId);
        
        localStorage.removeItem(answersKey);
        localStorage.removeItem(metadataKey);
        
        return true;
    } catch (error) {
        console.error('Error clearing exam cache:', error);
        return false;
    }
};

/**
 * Get the count of answered questions
 * @param {string} examId - The exam ID
 * @returns {number} Number of answered questions
 */
export const getAnsweredCount = (examId) => {
    try {
        const answers = loadAnswersFromCache(examId);
        return Object.keys(answers).length;
    } catch (error) {
        console.error('Error getting answered count:', error);
        return 0;
    }
};

/**
 * Check if a specific question has been answered
 * @param {string} examId - The exam ID
 * @param {string} questionId - The question ID
 * @returns {boolean} True if answered, false otherwise
 */
export const isQuestionAnswered = (examId, questionId) => {
    try {
        const answers = loadAnswersFromCache(examId);
        return answers.hasOwnProperty(questionId);
    } catch (error) {
        console.error('Error checking if question answered:', error);
        return false;
    }
};

/**
 * Update metadata (last updated time, answer count)
 * @param {string} examId - The exam ID
 */
const updateMetadata = (examId) => {
    try {
        const metadataKey = getMetadataKey(examId);
        const answerCount = getAnsweredCount(examId);
        
        const metadata = {
            lastUpdated: new Date().toISOString(),
            answerCount,
            examId
        };
        
        localStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (error) {
        console.error('Error updating metadata:', error);
    }
};

/**
 * Get exam metadata
 * @param {string} examId - The exam ID
 * @returns {Object|null} Metadata object or null
 */
export const getExamMetadata = (examId) => {
    try {
        const metadataKey = getMetadataKey(examId);
        const data = localStorage.getItem(metadataKey);
        
        if (!data) {
            return null;
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting exam metadata:', error);
        return null;
    }
};

/**
 * Merge server answers with cached answers (server takes precedence)
 * @param {string} examId - The exam ID
 * @param {Object} serverAnswers - Answers from server
 * @returns {Object} Merged answers
 */
export const mergeWithServerAnswers = (examId, serverAnswers) => {
    try {
        const cachedAnswers = getSimpleAnswers(examId);
        
        // Server answers take precedence
        const merged = {
            ...cachedAnswers,
            ...serverAnswers
        };
        
        // Update cache with merged data
        saveAllAnswersToCache(examId, merged);
        
        return merged;
    } catch (error) {
        console.error('Error merging answers:', error);
        return serverAnswers || {};
    }
};

/**
 * Clear all exam caches (useful for logout or cleanup)
 */
export const clearAllExamCaches = () => {
    try {
        const keys = Object.keys(localStorage);
        const examKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
        
        examKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return true;
    } catch (error) {
        console.error('Error clearing all exam caches:', error);
        return false;
    }
};
