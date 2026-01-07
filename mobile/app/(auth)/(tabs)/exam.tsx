import { View, Text, StyleSheet, TouchableOpacity, FlatList, ListRenderItem, ScrollView, Alert, ActivityIndicator, RefreshControl, Animated, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../store/AuthContext';
import { apiClient } from '../../../services/api';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useFocusEffect } from 'expo-router';
import { examSessionManager } from '../../../store/examSession';
import { dataCache } from '../../../store/dataCache';

type GlobalExamStatus = 'not_started' | 'active' | 'expired';

interface Exam {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    startTime: string;
    endTime: string;
}

interface ExamAttempt {
    examId: string;
    status: 'active' | 'submitted' | 'expired';
    attemptId: string;
    submittedAt: string | null;
}

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
// Memoized Exam Card Component
const ExamCard = memo(({
    exam,
    attempt,
    globalStatus,
    onNavigate,
    statusColors,
    statusTexts,
    difficultyColors
}: {
    exam: Exam;
    attempt: ExamAttempt | undefined;
    globalStatus: GlobalExamStatus;
    onNavigate: (exam: Exam) => void;
    statusColors: (status: GlobalExamStatus) => string;
    statusTexts: (status: GlobalExamStatus) => string;
    difficultyColors: (diff: string) => string;
}) => {
    let displayStatusText = statusTexts(globalStatus);
    let displayStatusColor = statusColors(globalStatus);
    let buttonText = 'Upcoming';
    let isLiveButton = false;
    let isResultButton = false;
    let isDisabledButton = true;

    if (attempt) {
        if (attempt.status === 'submitted') {
            isResultButton = true;
            isDisabledButton = false;
            buttonText = 'View Result';
            displayStatusText = 'Submitted';
            displayStatusColor = '#34c759';
        } else if (attempt.status === 'active') {
            isLiveButton = true;
            isDisabledButton = false;
            buttonText = 'Resume Exam';
            displayStatusText = 'In Progress';
            displayStatusColor = '#ff9500';
        } else if (attempt.status === 'expired') {
            isResultButton = true;
            isDisabledButton = false;
            buttonText = 'View Result';
            displayStatusText = 'Time Expired';
            displayStatusColor = '#999';
        }
    } else {
        if (globalStatus === 'active') {
            isLiveButton = true;
            isDisabledButton = false;
            buttonText = 'Start Exam';
        } else if (globalStatus === 'not_started') {
            buttonText = 'Upcoming';
            isDisabledButton = true;
        } else {
            buttonText = 'Expired';
            isDisabledButton = true;
        }
    }

    return (
        <View style={styles.examCard}>
            <View style={styles.examHeader}>
                <Text style={styles.examTitle}>{exam.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: displayStatusColor }]}>
                    <Text style={styles.statusText}>{displayStatusText}</Text>
                </View>
            </View>

            <View style={styles.examDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Difficulty:</Text>
                    <Text style={[styles.detailValue, { color: difficultyColors(exam.difficulty) }]}>
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

            {isLiveButton ? (
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => onNavigate(exam)}
                >
                    <Text style={styles.startButtonText}>{buttonText}</Text>
                </TouchableOpacity>
            ) : isResultButton ? (
                <TouchableOpacity
                    style={styles.resultButton}
                    onPress={() => onNavigate(exam)}
                >
                    <Text style={styles.resultButtonText}>{buttonText}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.disabledButton}
                    disabled={isDisabledButton}
                    onPress={() => !isDisabledButton && onNavigate(exam)}
                >
                    <Text style={styles.disabledButtonText}>{buttonText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

export default function ExamScreen() {
    const router = useRouter();
    const { student } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startingExamId, setStartingExamId] = useState<string | null>(null);
    const [isSlowConnection, setIsSlowConnection] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const cachedExams = dataCache.getExams();
            const cachedAttempts = dataCache.getAttempts();

            if (cachedExams && cachedAttempts) {
                setExams(cachedExams);
                setAttempts(cachedAttempts);
                setLoading(false);
            } else {
                fetchExams();
            }
        }, [])
    );

    useEffect(() => {
        // Auto-refresh attempts when app comes to foreground
        const listener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                fetchExams(true); // silent refresh
            }
        });

        return () => listener.remove();
    }, []);

    const fetchExams = async (isSilent = false) => {
        if (!student?.academySlug) {
            setError('Academy information not available');
            setLoading(false);
            return;
        }

        if (!isSilent) setError(null);
        setIsSlowConnection(false);

        // Slow connection detector (only if not silent)
        let slowTimer: any;
        if (!isSilent) {
            slowTimer = setTimeout(() => {
                if (loading) setIsSlowConnection(true);
            }, 4000);
        }

        try {
            // Fetch exams and attempts in parallel
            const [examsRes, attemptsRes] = await Promise.all([
                apiClient.get<any>(`/exams/academy/${student.academySlug}`),
                apiClient.get<ExamAttempt[]>('/students/exam-attempts')
            ]);

            if (examsRes.success && examsRes.data) {
                const examsList = examsRes.data.exams || [];
                const sortedExams = examsList.sort((a: Exam, b: Exam) =>
                    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                );
                setExams(sortedExams);
                dataCache.setExams(sortedExams);
            } else if (!isSilent) {
                setError(examsRes.error?.message || 'We could not reach the exam server. Please check your data connection.');
                setExams([]);
            }

            if (attemptsRes.success && attemptsRes.data) {
                setAttempts(attemptsRes.data);
                dataCache.setAttempts(attemptsRes.data);
            }

            if (!isSilent) setError(null);
        } catch (err) {
            if (!isSilent) setError('Connection failed. Please check your internet and try again.');
        } finally {
            if (slowTimer) clearTimeout(slowTimer);
            setLoading(false);
            setIsSlowConnection(false);
            setRefreshing(false);
        }
    };

    const getGlobalStatus = (exam: Exam): GlobalExamStatus => {
        const now = new Date();
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);

        if (now < startTime) return 'not_started';
        if (now >= startTime && now <= endTime) return 'active';
        return 'expired';
    };

    const getStatusColor = (status: GlobalExamStatus): string => {
        switch (status) {
            case 'active': return '#34c759';
            case 'not_started': return '#007AFF';
            case 'expired': return '#999';
        }
    };

    const getStatusText = (status: GlobalExamStatus): string => {
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchExams();
    };

    const handleExamNavigate = (exam: Exam) => {
        const globalStatus = getGlobalStatus(exam);

        // Upcoming is purely blocked
        if (globalStatus === 'not_started') return;

        // All other states (Live, Expired, Submitted, Active) go to Gate
        // Gate will resolve the true state and redirect correctly
        router.push({
            pathname: '/(auth)/exam-gate',
            params: {
                examId: exam.id,
                title: exam.title
            }
        });
    };

    const renderExamItem: ListRenderItem<Exam> = useCallback(({ item: exam }) => {
        const globalStatus = getGlobalStatus(exam);
        const attempt = attempts.find(a => a.examId === exam.id);

        return (
            <ExamCard
                exam={exam}
                attempt={attempt}
                globalStatus={globalStatus}
                onNavigate={handleExamNavigate}
                statusColors={getStatusColor}
                statusTexts={getStatusText}
                difficultyColors={getDifficultyColor}
            />
        );
    }, [attempts, handleExamNavigate]);

    return (
        <FlatList
            data={exams}
            keyExtractor={(item) => item.id}
            renderItem={renderExamItem}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
            }
            contentContainerStyle={styles.content}
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Available Exams</Text>
                    <Text style={styles.headerSubtitle}>{student?.academyName}</Text>
                </View>
            }
            ListEmptyComponent={
                loading && !refreshing ? (
                    <View>
                        <SkeletonExamCard />
                        <SkeletonExamCard />
                        <SkeletonExamCard />
                        {isSlowConnection && (
                            <View style={styles.slowConnectionHint}>
                                <ActivityIndicator size="small" color="#666" />
                                <Text style={styles.slowText}>Your connection is a bit slow. Hang tight!</Text>
                            </View>
                        )}
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>❌ {error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => fetchExams()}
                            disabled={refreshing}
                        >
                            <Text style={styles.retryButtonText}>
                                {refreshing ? 'Loading...' : 'Retry'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Text style={styles.emptyIcon}>📝</Text>
                        </View>
                        <Text style={styles.emptyStateText}>No exams available Yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Your academy hasn't scheduled any exams. Check back later!
                        </Text>
                    </View>
                )
            }
            ListFooterComponent={
                exams.length > 0 ? (
                    <View style={[styles.apiInfo, { marginTop: 8 }]}>
                        <Text style={styles.apiInfoText}>✅ Pull down to refresh</Text>
                    </View>
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    content: { padding: 16 },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    headerSubtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    slowConnectionHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 12, marginTop: 10 },
    slowText: { marginLeft: 10, color: '#666', fontSize: 14, fontWeight: '500' },
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
