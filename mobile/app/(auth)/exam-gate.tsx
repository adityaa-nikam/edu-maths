import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { examSessionManager } from '../../store/examSession';

/**
 * ExamGate Screen
 * 
 * Flow controller for entering the exam lifecycle.
 * Handles decisions: Start, Resume, View Result, or Block.
 */
export default function ExamGateScreen() {
    const router = useRouter();
    const { examId } = useLocalSearchParams<{ examId: string }>();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        // Rule: examId is required
        if (!examId) {
            router.replace('/(auth)/(tabs)/exam');
            return;
        }
        runFlowController();
    }, [examId]);

    const runFlowController = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            // 1. Get Exam Temporal Status
            const statusRes = await apiClient.get<any>(`/exams/${examId}/status`);

            if (!statusRes.success) {
                setErrorMsg(statusRes.error?.message || 'Unable to connect to exam server');
                setLoading(false);
                return;
            }

            const { status, title } = statusRes.data;

            // Session cleanup rules
            const currentSession = examSessionManager.getSession();
            if (currentSession && (currentSession.examId !== examId || status === 'expired' || currentSession.examStatus === 'submitted')) {
                await examSessionManager.clearSession();
            }

            // 2. Decision Logic Tree

            // --- CASE: NOT STARTED ---
            if (status === 'not_started') {
                setErrorMsg('Exam has not started yet');
                setLoading(false);
                return;
            }

            // --- CASE: ACTIVE ---
            if (status === 'active') {
                // Check if attempt already exists
                const questionsRes = await apiClient.get<any>(`/exams/${examId}/questions`);

                if (questionsRes.success) {
                    // b) Attempt EXISTS: Resume exam
                    await examSessionManager.startSession({
                        examId: examId!,
                        attemptId: questionsRes.data.attemptId,
                        startedAt: questionsRes.data.startedAt,
                        durationMinutes: questionsRes.data.durationMinutes
                    });

                    router.replace({
                        pathname: '/(auth)/exam-taking',
                        params: {
                            attemptId: questionsRes.data.attemptId,
                            examId: examId!,
                            examTitle: title,
                            durationMinutes: questionsRes.data.durationMinutes.toString(),
                            serverStartTime: questionsRes.data.startedAt
                        }
                    });
                } else if (questionsRes.error?.statusCode === 400) {
                    // a) Attempt DOES NOT exist: Call start exam API
                    const startRes = await apiClient.post<any>(`/exams/${examId}/start`);

                    if (startRes.success) {
                        // Save session state
                        await examSessionManager.startSession({
                            examId: examId!,
                            attemptId: startRes.data.attemptId,
                            startedAt: startRes.data.serverStartTime,
                            durationMinutes: startRes.data.durationMinutes
                        });

                        // Navigate to ExamTaking screen
                        router.replace({
                            pathname: '/(auth)/exam-taking',
                            params: {
                                attemptId: startRes.data.attemptId,
                                examId: examId!,
                                examTitle: title,
                                durationMinutes: startRes.data.durationMinutes.toString(),
                                serverStartTime: startRes.data.serverStartTime
                            }
                        });
                    } else {
                        setErrorMsg(startRes.error?.message || 'Failed to initialize exam session');
                        setLoading(false);
                    }
                } else {
                    setErrorMsg(questionsRes.error?.message || 'Error validating exam session');
                    setLoading(false);
                }
                return;
            }

            // --- CASE: EXPIRED ---
            if (status === 'expired') {
                // Check if exam was submitted
                const resultRes = await apiClient.get<any>(`/exams/${examId}/result`);
                if (resultRes.success) {
                    // a) Submitted: Navigate to ExamResult screen
                    router.replace({
                        pathname: '/(auth)/result',
                        params: {
                            score: resultRes.data.score.toString(),
                            totalQuestions: resultRes.data.totalQuestions.toString(),
                            percentage: resultRes.data.percentage.toString(),
                            examTitle: title,
                            autoSubmitted: 'false'
                        }
                    });
                } else {
                    // b) Not submitted: Block access
                    setErrorMsg('Exam time expired');
                    setLoading(false);
                }
                return;
            }

        } catch (err) {
            console.error('Flow Controller Error:', err);
            setErrorMsg('A critical error occurred while preparing your session');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Synchronizing with server...</Text>
            </View>
        );
    }

    return (
        <View style={styles.center}>
            <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Action Required</Text>
                <Text style={styles.errorMsg}>{errorMsg}</Text>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(auth)/(tabs)/exam')}
                >
                    <Text style={styles.backButtonText}>Back to Exams</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 24 },
    loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontWeight: '600' },
    errorCard: { backgroundColor: '#fff', padding: 32, borderRadius: 24, alignItems: 'center', width: '100%', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
    errorIcon: { fontSize: 56, marginBottom: 16 },
    errorTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
    errorMsg: { fontSize: 16, color: '#4a4a4a', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
    backButton: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
    backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
