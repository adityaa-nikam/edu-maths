/**
 * Exam Screen (Authenticated)
 * 
 * List of available exams for the student.
 * Fetches from API: GET /api/exams/academy/:academySlug
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { apiClient } from '../../services/api';
import { useState, useEffect } from 'react';

interface Exam {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    startTime: string;
    endTime: string;
}

type ExamStatus = 'not_started' | 'active' | 'expired';

export default function ExamScreen() {
    const { student } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        if (!student?.academySlug) {
            setError('Academy information not available');
            setLoading(false);
            return;
        }

        setError(null);

        const response = await apiClient.get(`/exams/academy/${student.academySlug}`);

        if (response.success && response.data) {
            const data = response.data as any;
            setExams(data.exams || []);
            setError(null);
        } else {
            setError(response.error?.message || 'Failed to load exams');
            setExams([]);
        }

        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchExams();
    };

    const getExamStatus = (exam: Exam): ExamStatus => {
        const now = new Date();
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);

        if (now < startTime) {
            return 'not_started';
        } else if (now >= startTime && now <= endTime) {
            return 'active';
        } else {
            return 'expired';
        }
    };

    const getStatusColor = (status: ExamStatus): string => {
        switch (status) {
            case 'active':
                return '#34c759';
            case 'not_started':
                return '#007AFF';
            case 'expired':
                return '#999';
        }
    };

    const getStatusText = (status: ExamStatus): string => {
        switch (status) {
            case 'active':
                return 'Live Now';
            case 'not_started':
                return 'Not Started';
            case 'expired':
                return 'Expired';
        }
    };

    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy':
                return '#34c759';
            case 'medium':
                return '#ff9500';
            case 'hard':
                return '#ff3b30';
            default:
                return '#666';
        }
    };

    const handleStartExam = async (exam: Exam) => {
        const status = getExamStatus(exam);

        if (status !== 'active') {
            Alert.alert('Cannot Start', 'This exam is not currently active');
            return;
        }

        Alert.alert(
            'Start Exam',
            `Ready to start "${exam.title}"?\n\nOnce started, the timer will begin.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    onPress: () => startExamAttempt(exam.id, exam.title)
                },
            ]
        );
    };

    const startExamAttempt = async (examId: string, examTitle: string) => {
        setLoading(true);

        try {
            // Call start exam API
            const response = await apiClient.post(`/exams/${examId}/start`);

            if (response.success && response.data) {
                const data = response.data as any;

                // Extract attempt info from response
                const attemptId = data.attemptId;
                const durationMinutes = data.durationMinutes;
                const serverStartTime = data.serverStartTime;

                console.log('✅ Exam started successfully:', {
                    attemptId,
                    durationMinutes,
                    serverStartTime
                });

                // Navigate to exam taking screen with attempt info
                // Using expo-router's push to navigate
                const router = require('expo-router').router;
                router.push({
                    pathname: '/(auth)/exam-taking',
                    params: {
                        attemptId,
                        examId,
                        examTitle,
                        durationMinutes: durationMinutes.toString(),
                        serverStartTime
                    }
                });
            } else {
                // Handle API error
                const errorMessage = response.error?.message || 'Failed to start exam';
                Alert.alert('Error', errorMessage);
            }
        } catch (error: any) {
            console.error('❌ Error starting exam:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading exams...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchExams}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Available Exams</Text>
                    <Text style={styles.headerSubtitle}>
                        {student?.academyName}
                    </Text>
                </View>

                {exams.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>📝 No exams available</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Check back later for upcoming exams
                        </Text>
                    </View>
                ) : (
                    exams.map((exam) => {
                        const status = getExamStatus(exam);
                        return (
                            <View key={exam.id} style={styles.examCard}>
                                <View style={styles.examHeader}>
                                    <Text style={styles.examTitle}>{exam.title}</Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(status) },
                                        ]}
                                    >
                                        <Text style={styles.statusText}>
                                            {getStatusText(status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.examDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Difficulty:</Text>
                                        <Text
                                            style={[
                                                styles.detailValue,
                                                { color: getDifficultyColor(exam.difficulty) },
                                            ]}
                                        >
                                            {exam.difficulty.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Start:</Text>
                                        <Text style={styles.detailValue}>
                                            {new Date(exam.startTime).toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>End:</Text>
                                        <Text style={styles.detailValue}>
                                            {new Date(exam.endTime).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>

                                {status === 'active' && (
                                    <TouchableOpacity
                                        style={styles.startButton}
                                        onPress={() => handleStartExam(exam)}
                                    >
                                        <Text style={styles.startButtonText}>Start Exam</Text>
                                    </TouchableOpacity>
                                )}

                                {status === 'not_started' && (
                                    <View style={styles.disabledButton}>
                                        <Text style={styles.disabledButtonText}>Not Started Yet</Text>
                                    </View>
                                )}

                                {status === 'expired' && (
                                    <View style={styles.disabledButton}>
                                        <Text style={styles.disabledButtonText}>Exam Ended</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                {/* API Info */}
                <View style={styles.apiInfo}>
                    <Text style={styles.apiInfoText}>
                        API: GET /api/exams/academy/:slug
                    </Text>
                    <Text style={styles.apiInfoText}>
                        ✅ Pull down to refresh
                    </Text>
                </View>

                {/* Loading overlay when starting exam */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingOverlayText}>Starting exam...</Text>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
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
        padding: 20,
    },
    content: {
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#c62828',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    examCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    examHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    examTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    examDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    startButton: {
        backgroundColor: '#34c759',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#f0f0f0',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButtonText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600',
    },
    apiInfo: {
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        marginTop: 8,
    },
    apiInfoText: {
        fontSize: 12,
        color: '#1976d2',
        textAlign: 'center',
        marginBottom: 2,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingBox: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 200,
    },
    loadingOverlayText: {
        marginTop: 12,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
});
