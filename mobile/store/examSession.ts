import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Exam Session Manager
 * 
 * Centralized store for the active exam session with persistence.
 * Tracks exam lifecycle: active -> submitted | expired
 */

export type ExamStatus = 'active' | 'submitted' | 'expired';

export interface ExamSession {
    examId: string;
    attemptId: string;
    examStatus: ExamStatus;
    startedAt: string;
    durationMinutes: number;
    submittedAt?: string;
}

const STORAGE_KEY = '@edu_maths_exam_session';

let activeSession: ExamSession | null = null;

export const examSessionManager = {
    /**
     * Initialize the store from persistent storage (call on app launch)
     */
    init: async (): Promise<ExamSession | null> => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            activeSession = data ? JSON.parse(data) : null;
            return activeSession;
        } catch (error) {
            console.error('❌ Error initializing exam session:', error);
            return null;
        }
    },

    /**
     * Start a new exam session or initialize one from Gate
     */
    startSession: async (session: Omit<ExamSession, 'examStatus'>): Promise<void> => {
        activeSession = { ...session, examStatus: 'active' };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
        console.log('🏁 Exam session active:', activeSession.examId);
    },

    /**
     * Mark exam as submitted
     */
    submitSession: async (submittedAt: string): Promise<void> => {
        if (activeSession) {
            activeSession.examStatus = 'submitted';
            activeSession.submittedAt = submittedAt;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
            console.log('✅ Exam session marked as submitted');
        }
    },

    /**
     * Mark exam as expired
     */
    expireSession: async (): Promise<void> => {
        if (activeSession) {
            activeSession.examStatus = 'expired';
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
            console.log('⏰ Exam session marked as expired');
        }
    },

    /**
     * Get the current active session
     */
    getSession: () => activeSession,

    /**
     * Clear the current session permanently
     */
    clearSession: async () => {
        activeSession = null;
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Exam session cleared');
    },

    /**
     * Validate if stored session matches a specific examId
     */
    isValidFor: (examId: string) => {
        return activeSession?.examId === examId;
    }
};
