import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../store/AuthContext';
import { apiClient } from '../../../services/api';
import { useState, useEffect, useRef } from 'react';
import { examSessionManager } from '../../../store/examSession';
interface Exam {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    startTime: string;
    endTime: string;
}

type ExamStatus = 'not_started' | 'active' | 'expired';

// Skeleton Card Component with Pulse Animation
const SkeletonExamCard = () => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.examCard, { opacity: pulseAnim }]}>
            <View style={styles.examHeader}>
                <View style={[styles.skeletonTitle, { width: '60%' }]} />
                <View style={[styles.skeletonBadge, { width: 60 }]} />
            </View>
            <View style={styles.examDetails}>
                <View style={[styles.skeletonDetail, { width: '40%' }]} />
                <View style={[styles.skeletonDetail, { width: '80%' }]} />
                <View style={[styles.skeletonDetail, { width: '80%' }]} />
            </View>
            <View style={[styles.skeletonButton, { height: 44, marginTop: 12 }]} />
        </Animated.View>
    );
};
export default function ExamScreen() {
    const router = useRouter();
    const { student } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startingExamId, setStartingExamId] = useState<string | null>(null);

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

        const response = await apiClient.get<any>(`/exams/academy/${student.academySlug}`);

        if (response.success && response.data) {
            const examsList = response.data.exams || [];
            const sortedExams = examsList.sort((a: Exam, b: Exam) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            setExams(sortedExams);
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

        if (now < startTime) return 'not_started';
        if (now >= startTime && now <= endTime) return 'active';
        return 'expired';
    };

    const getStatusColor = (status: ExamStatus): string => {
        switch (status) {
            case 'active': return '#34c759';
            case 'not_started': return '#007AFF';
            case 'expired': return '#999';
        }
    };

    const getStatusText = (status: ExamStatus): string => {
        switch (status) {
            case 'active': return 'Live Now';
            case 'not_started': return 'Not Started';
            case 'expired': return 'Expired';
        }
    };

    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy': return '#34c759';
            case 'medium': return '#ff9500';
            case 'hard': return '#ff3b30';
            default: return '#666';
        }
    };

    const handleExamNavigate = (exam: Exam) => {
        const status = getExamStatus(exam);

        // Navigation logic: both Live and Expired go to Gate
        if (status === 'not_started') return;

        router.push({
            pathname: '/(auth)/exam-gate',
            params: { examId: exam.id }
        });
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
            }
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Available Exams</Text>
                    <Text style={styles.headerSubtitle}>{student?.academyName}</Text>
                </View>

                {loading && !refreshing ? (
                    <View>
                        <SkeletonExamCard />
                        <SkeletonExamCard />
                        <SkeletonExamCard />
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>❌ {error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchExams}
                            disabled={refreshing}
                        >
                            <Text style={styles.retryButtonText}>
                                {refreshing ? 'Loading...' : 'Retry'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : exams.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Text style={styles.emptyIcon}>📝</Text>
                        </View>
                        <Text style={styles.emptyStateText}>No exams available Yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Your academy hasn't scheduled any exams. Check back later!
                        </Text>
                    </View>
                ) : (
                    exams.map((exam) => {
                        const status = getExamStatus(exam);
                        const isStarting = startingExamId === exam.id;

                        // Check session store to see if this exam can be resumed
                        const activeSession = examSessionManager.getSession();
                        const isResumable = activeSession?.examId === exam.id && activeSession.examStatus === 'active';

                        return (
                            <View key={exam.id} style={styles.examCard}>
                                <View style={styles.examHeader}>
                                    <Text style={styles.examTitle}>{exam.title}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                                        <Text style={styles.statusText}>{getStatusText(status)}</Text>
                                    </View>
                                </View>

                                <View style={styles.examDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Difficulty:</Text>
                                        <Text style={[styles.detailValue, { color: getDifficultyColor(exam.difficulty) }]}>
                                            {exam.difficulty.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Start:</Text>
                                        <Text style={styles.detailValue}>{new Date(exam.startTime).toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>End:</Text>
                                        <Text style={styles.detailValue}>{new Date(exam.endTime).toLocaleString()}</Text>
                                    </View>
                                </View>

                                {status === 'active' ? (
                                    <TouchableOpacity
                                        style={[styles.startButton, isStarting && styles.buttonDisabled]}
                                        onPress={() => handleExamNavigate(exam)}
                                        disabled={isStarting}
                                    >
                                        {isStarting ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.startButtonText}>
                                                {isResumable ? 'Resume Exam' : 'Start Exam'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ) : status === 'expired' ? (
                                    <TouchableOpacity
                                        style={styles.resultButton}
                                        onPress={() => handleExamNavigate(exam)}
                                    >
                                        <Text style={styles.resultButtonText}>View Result</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.disabledButton}>
                                        <Text style={styles.disabledButtonText}>Upcoming</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                <View style={[styles.apiInfo, { marginTop: 24 }]}>
                    <Text style={styles.apiInfoText}>✅ Pull down to refresh</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    content: { padding: 16 },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    headerSubtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    errorText: { fontSize: 16, color: '#dc3545', textAlign: 'center', marginBottom: 20 },
    retryButton: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    emptyState: { padding: 60, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, marginTop: 20 },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyIcon: { fontSize: 40 },
    emptyStateText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    emptyStateSubtext: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
    examCard: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eef2f6', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    examTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    examDetails: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, marginBottom: 16 },
    detailRow: { flexDirection: 'row', marginBottom: 8 },
    detailLabel: { fontSize: 13, color: '#777', width: 85 },
    detailValue: { fontSize: 13, color: '#444', fontWeight: '600', flex: 1 },
    startButton: { backgroundColor: '#34c759', padding: 16, borderRadius: 12, alignItems: 'center', height: 54, justifyContent: 'center' },
    startButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#94d3a2', opacity: 0.8 },
    resultButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
    resultButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { backgroundColor: '#f1f3f5', padding: 16, borderRadius: 12, alignItems: 'center' },
    disabledButtonText: { color: '#adb5bd', fontSize: 15, fontWeight: '600' },
    apiInfo: { padding: 12, backgroundColor: '#eef6ff', borderRadius: 12 },
    apiInfoText: { fontSize: 13, color: '#007AFF', textAlign: 'center', fontWeight: '500' },

    // Skeleton Styles
    skeletonTitle: { height: 24, backgroundColor: '#e9ecef', borderRadius: 6 },
    skeletonBadge: { height: 24, backgroundColor: '#e9ecef', borderRadius: 8 },
    skeletonDetail: { height: 16, backgroundColor: '#f1f3f5', borderRadius: 4, marginBottom: 8 },
    skeletonButton: { backgroundColor: '#e9ecef', borderRadius: 12 },
});
