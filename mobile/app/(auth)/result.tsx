/**
 * Result Screen (Authenticated)
 * 
 * Shows student's exam result after submission.
 * Displays score, total questions, percentage, and pass/fail message.
 */

import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { examSessionManager } from '../../store/examSession';
import { apiClient } from '../../services/api';

export default function ResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ examTitle: string }>();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSlow, setIsSlow] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        // 1. Strict Entry Condition Guard
        const session = examSessionManager.getSession();

        // Final authority: Session MUST be marked as submitted
        if (!session || session.examStatus !== 'submitted') {
            console.error('🚫 Blocked access to Result: No submitted session found');
            router.replace('/(auth)/(tabs)/home');
            return;
        }

        // 2. Fetch Result from Backend (Final Authority)
        fetchFinalResult(session.examId);

        // 3. Block Back Navigation
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleReturnHome();
            return true;
        });

        return () => {
            backHandler.remove();
        };
    }, []);

    const fetchFinalResult = async (examId: string) => {
        setLoading(true);
        setIsSlow(false);
        const slowTimer = setTimeout(() => setIsSlow(true), 4000);

        try {
            const response = await apiClient.get<any>(`/exams/${examId}/result`);
            if (response.success && response.data) {
                setResult(response.data);
            } else {
                Alert.alert('Error', 'Unable to retrieve your exam results.');
                router.replace('/(auth)/(tabs)/home');
            }
        } catch (err) {
            Alert.alert('Connection Error', 'Could not sync results with server.');
            router.replace('/(auth)/(tabs)/home');
        } finally {
            clearTimeout(slowTimer);
            setLoading(false);
            setIsSlow(false);
        }
    };

    const handleReturnHome = async () => {
        // Clear the finished session completely before exiting
        await examSessionManager.clearSession();
        router.replace('/(auth)/(tabs)/home');
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Finalizing your results...</Text>
                {isSlow && (
                    <Text style={styles.slowText}>This is taking longer than usual, please wait...</Text>
                )}
            </View>
        );
    }

    if (!result) return null;

    const score = result.score;
    const totalQuestions = result.totalQuestions;
    const percentage = result.percentage;
    const autoSubmitted = result.autoSubmitted === true;
    const examTitle = params.examTitle || result.examTitle || 'Exam Result';

    // Determine pass/fail (60% is passing)
    const isPassed = percentage >= 60;

    // Get message based on performance
    const getMessage = () => {
        if (percentage >= 90) return 'Excellent! 🌟';
        if (percentage >= 80) return 'Great Job! 🎉';
        if (percentage >= 70) return 'Good Work! 👍';
        if (percentage >= 60) return 'Passed! ✓';
        return 'Keep Practicing! 💪';
    };

    // Get color based on performance
    const getScoreColor = () => {
        if (percentage >= 90) return '#34c759';
        if (percentage >= 70) return '#ff9500';
        return '#ff3b30';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Exam Completed</Text>
                {autoSubmitted && (
                    <Text style={styles.autoSubmitText}>⏰ Auto-submitted (Time Expired)</Text>
                )}
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Exam Title */}
                <Text style={styles.examTitle}>{examTitle}</Text>

                {/* Score Circle */}
                <View style={[styles.scoreCircle, { borderColor: getScoreColor() }]}>
                    <Text style={[styles.scorePercentage, { color: getScoreColor() }]}>
                        {percentage}%
                    </Text>
                    <Text style={styles.scoreLabel}>Score</Text>
                </View>

                {/* Message */}
                <Text style={[styles.message, { color: getScoreColor() }]}>
                    {getMessage()}
                </Text>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: isPassed ? '#34c759' : '#ff3b30' }]}>
                    <Text style={styles.statusText}>
                        {isPassed ? '✓ PASSED' : '✗ NOT PASSED'}
                    </Text>
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Correct Answers:</Text>
                        <Text style={styles.detailValue}>{score} / {totalQuestions}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Questions:</Text>
                        <Text style={styles.detailValue}>{totalQuestions}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Percentage:</Text>
                        <Text style={[styles.detailValue, { color: getScoreColor() }]}>
                            {percentage}%
                        </Text>
                    </View>
                </View>

                {/* Info Box */}
                {!isPassed && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            💡 Tip: You need 60% or higher to pass
                        </Text>
                        <Text style={styles.infoText}>
                            Keep practicing to improve your score!
                        </Text>
                    </View>
                )}

                {/* Return Button */}
                <TouchableOpacity
                    style={styles.returnButton}
                    onPress={handleReturnHome}
                >
                    <Text style={styles.returnButtonText}>Return to Exams</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    slowText: {
        marginTop: 10,
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    autoSubmitText: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    examTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },
    scoreCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    scorePercentage: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    message: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    statusBadge: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginBottom: 30,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    detailsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 4,
    },
    infoBox: {
        backgroundColor: '#fff3cd',
        padding: 16,
        borderRadius: 8,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    infoText: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 4,
        textAlign: 'center',
    },
    returnButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    returnButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
