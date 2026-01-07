import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api';
import { examSessionManager } from '../../store/examSession';
import { dataCache } from '../../store/dataCache';

interface Question {
    id: string;
    question: string;
    options: string[];
}

interface ExamData {
    examId: string;
    title: string;
    difficulty: string;
    totalQuestions: number;
    durationMinutes: number;
    attemptId: string;
    questions: Question[];
}

// Skeleton Question Loader
const SkeletonQuestion = ({ isSlow }: { isSlow?: boolean }) => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{ opacity: pulseAnim, flex: 1 }}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonIndicator} />
            <ScrollView style={styles.scrollContent}>
                <View style={styles.skeletonQuestionBox} />
                <View style={styles.optionsContainer}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={styles.skeletonOption} />
                    ))}
                </View>
                {isSlow && (
                    <View style={styles.slowConnectionHintTaking}>
                        <ActivityIndicator size="small" color="#666" />
                        <Text style={styles.slowTextTaking}>Taking a moment to sync with server...</Text>
                    </View>
                )}
            </ScrollView>
            <View style={styles.skeletonNav} />
        </Animated.View>
    );
};

export default function ExamTakingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        attemptId: string;
        examId: string;
        examTitle: string;
        durationMinutes: string;
        serverStartTime: string;
    }>();

    const [examData, setExamData] = useState<ExamData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, number>>(new Map());
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [savingAnswer, setSavingAnswer] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasSubmittedRef = useRef(false);
    const answerDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const navigation = useNavigation();

    const isConfirmedRef = useRef(false);

    // Back Button and Tab Safety
    useEffect(() => {
        const handleBackAction = () => {
            if (hasSubmittedRef.current || submitting || isConfirmedRef.current) return false;

            Alert.alert(
                'Leaving Exam?',
                'Are you sure you want to leave? \n\n⚠️ The timer will NOT pause. \n⚠️ You might lose unsaved progress.',
                [
                    { text: 'Stay & Continue', style: 'cancel' },
                    {
                        text: 'Exit Exam',
                        style: 'destructive',
                        onPress: () => {
                            isConfirmedRef.current = true;
                            router.replace('/(auth)/(tabs)/exam');
                        }
                    },
                ],
                { cancelable: true }
            );
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackAction);

        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (hasSubmittedRef.current || submitting || isConfirmedRef.current) return;

            // If we are already trying to exit via handleBackAction, don't show double alerts
            // But beforeRemove handles more than just back (like tab clicks if they trigger navigation)
            e.preventDefault();
            Alert.alert(
                'Leave Exam Session?',
                'The exam is still active. \n\n⚠️ Leaving will NOT stop the timer. \n⚠️ You will need to resume from the Exam List.',
                [
                    { text: 'Stay', style: 'cancel' },
                    {
                        text: 'Leave Anyway',
                        style: 'destructive',
                        onPress: () => {
                            isConfirmedRef.current = true;
                            navigation.dispatch(e.data.action);
                        }
                    },
                ]
            );
        });

        return () => {
            backHandler.remove();
            unsubscribe();
        };
    }, [navigation, submitting]);

    useEffect(() => {
        // 1. Strict Entry Condition Guard
        const session = examSessionManager.getSession();

        const isSessionValid = session &&
            session.examId &&
            session.attemptId &&
            session.examStatus === 'active';

        if (!isSessionValid) {
            console.error('🚫 Blocked access to ExamTaking: Invalid Store Session');
            Alert.alert('Access Denied', 'No active exam session found.');
            router.replace('/(auth)/(tabs)/exam');
            return;
        }

        hasSubmittedRef.current = false;
        fetchQuestions(session.examId);

        return () => {
            if (answerDebounceRef.current) clearTimeout(answerDebounceRef.current);
        };
    }, []);

    const [isSlowConnection, setIsSlowConnection] = useState(false);

    const fetchQuestions = async (examId: string) => {
        // 1. Try Cache First
        const cachedData = dataCache.getQuestions(examId);
        if (cachedData) {
            setExamData(cachedData);
            setLoading(false);

            const session = examSessionManager.getSession();
            const startTime = new Date(session!.startedAt).getTime();
            const duration = session!.durationMinutes * 60 * 1000;
            const endTime = startTime + duration;
            const currentRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeRemaining(currentRemaining);
            return;
        }

        setLoading(true);
        setError(null);
        setIsSlowConnection(false);
        const session = examSessionManager.getSession();

        const slowTimer = setTimeout(() => {
            if (loading) setIsSlowConnection(true);
        }, 4000);

        try {
            const response = await apiClient.get<ExamData>(`/exams/${examId}/questions`);
            if (response.success && response.data) {
                setExamData(response.data);
                dataCache.setQuestions(examId, response.data);

                // Authority: startedAt + durationMinutes
                const startTime = new Date(session!.startedAt).getTime();
                const duration = session!.durationMinutes * 60 * 1000;
                const endTime = startTime + duration;

                // Primary timer sync
                const currentRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

                if (currentRemaining <= 0) {
                    await examSessionManager.expireSession();
                    Alert.alert('Time Expired', 'This exam session has already ended.');
                    router.replace('/(auth)/(tabs)/exam');
                    return;
                }

                setTimeRemaining(currentRemaining);
            } else {
                setError(response.error?.message || 'We could not load your questions. Please check your data connection.');
            }
        } catch (err) {
            setError('Unable to load exam questions. Please check your connection and try again.');
        } finally {
            clearTimeout(slowTimer);
            setLoading(false);
            setIsSlowConnection(false);
        }
    };

    // Autoritative Timer: survive backgrounding
    useEffect(() => {
        if (loading || submitting || !examData || hasSubmittedRef.current) return;

        const session = examSessionManager.getSession();
        const endTime = new Date(session!.startedAt).getTime() + (session!.durationMinutes * 60 * 1000);

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

            setTimeRemaining(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                handleSubmitExam(true);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, submitting, !!examData]);

    const [isOffline, setIsOffline] = useState(false);
    const pendingSavesRef = useRef<Set<string>>(new Set());

    const handleSelectOption = (optionIndex: number) => {
        if (!examData || submitting) return;

        const currentQuestion = examData.questions[currentQuestionIndex];

        // Update UI immediately (Local State)
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestion.id, optionIndex);
        setAnswers(newAnswers);

        saveAnswer(currentQuestion.id, optionIndex);
    };

    const saveAnswer = async (questionId: string, optionIndex: number) => {
        if (answerDebounceRef.current) clearTimeout(answerDebounceRef.current);

        setSavingAnswer(true);
        answerDebounceRef.current = setTimeout(async () => {
            try {
                const session = examSessionManager.getSession();
                const res = await apiClient.post(`/exams/${session?.examId}/answer`, {
                    questionId,
                    selectedOption: optionIndex
                });

                if (res.success) {
                    setIsOffline(false);
                    pendingSavesRef.current.delete(questionId);
                } else if (res.error?.error === 'Network Error' || res.error?.error === 'Timeout') {
                    setIsOffline(true);
                    pendingSavesRef.current.add(questionId);
                }
            } catch (err) {
                setIsOffline(true);
                pendingSavesRef.current.add(questionId);
            } finally {
                setSavingAnswer(false);
            }
        }, 1000); // 1s debounce
    };

    // Retry Background Sync for Offline Answers
    useEffect(() => {
        if (submitting || !examData) return;

        const syncInterval = setInterval(async () => {
            if (pendingSavesRef.current.size === 0) return;

            console.log(`🔄 Retrying ${pendingSavesRef.current.size} pending answers...`);
            const session = examSessionManager.getSession();
            const examId = session?.examId;

            for (const qId of Array.from(pendingSavesRef.current)) {
                const optIndex = answers.get(qId);
                if (optIndex === undefined) continue;

                try {
                    const res = await apiClient.post(`/exams/${examId}/answer`, {
                        questionId: qId,
                        selectedOption: optIndex
                    });
                    if (res.success) {
                        pendingSavesRef.current.delete(qId);
                        setIsOffline(pendingSavesRef.current.size > 0);
                    }
                } catch (e) {
                    setIsOffline(true);
                    break; // Stop loop if still offline
                }
            }
        }, 5000); // Check every 5s

        return () => clearInterval(syncInterval);
    }, [answers, submitting, !!examData]);

    const goToNextQuestion = () => {
        if (!examData || submitting) return;
        if (currentQuestionIndex < examData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (submitting) return;
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitExam = (autoSubmit: boolean = false) => {
        if (submitting) return;

        if (!autoSubmit) {
            Alert.alert(
                'Submit Exam',
                'Are you sure you want to submit? You cannot change answers after submission.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Submit', onPress: () => submitExam() }
                ]
            );
        } else {
            submitExam();
        }
    };

    const submitExam = async () => {
        if (hasSubmittedRef.current) return;

        hasSubmittedRef.current = true;
        setSubmitting(true);

        try {
            const session = examSessionManager.getSession();
            const currentExamId = session?.examId;
            const currentTitle = examData?.title || params.examTitle || 'Exam Result';

            const response = await apiClient.post<any>(`/exams/${currentExamId}/submit`);
            if (response.success && response.data) {
                // Authority: Mark as submitted in store
                await examSessionManager.submitSession(new Date().toISOString());

                // OPTIMIZATION: Invalidate cache so dashboard refreshes
                dataCache.invalidateExams();
                dataCache.invalidateAttempts();
                dataCache.invalidateQuestions(currentExamId);

                const data = response.data;
                router.replace({
                    pathname: '/(auth)/result',
                    params: {
                        score: data.score.toString(),
                        totalQuestions: data.totalQuestions.toString(),
                        percentage: data.percentage.toString(),
                        examTitle: currentTitle,
                        autoSubmitted: data.autoSubmitted ? 'true' : 'false'
                    }
                });
            } else {
                const isNetworkError = response.error?.error === 'Network Error' || response.error?.error === 'Timeout';
                Alert.alert(
                    isNetworkError ? 'Connection Error' : 'Submission Failed',
                    response.error?.message || 'Failed to submit exam'
                );
                hasSubmittedRef.current = false;
                setSubmitting(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit exam. Please check your connection and try again.');
            hasSubmittedRef.current = false;
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <SkeletonQuestion isSlow={isSlowConnection} />;

    if (!examData) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Failed to load exam data</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQuestion = examData.questions[currentQuestionIndex];
    const selectedOption = answers.get(currentQuestion.id);
    const isLowTime = timeRemaining <= 300;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>{examData.title.toUpperCase()}</Text>
                    <Text style={styles.difficulty}>{examData.difficulty.toUpperCase()}</Text>
                </View>
                <View style={[styles.timerContainer, isLowTime && styles.timerContainerWarning]}>
                    <Text style={styles.timerText}>⏱️ {formatTime(timeRemaining)}</Text>
                </View>
            </View>

            {isOffline && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>⚠️ Connection lost. Syncing answers in background...</Text>
                </View>
            )}

            <View style={styles.questionIndicator}>
                <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1} of {examData.totalQuestions}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / examData.totalQuestions) * 100}%` }]} />
                </View>
            </View>

            <ScrollView style={styles.scrollContent}>
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                    {savingAnswer && (
                        <View style={styles.savingBadge}>
                            <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                    )}
                </View>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.optionButton, selectedOption === index && styles.optionButtonSelected]}
                            onPress={() => handleSelectOption(index)}
                            disabled={submitting}
                        >
                            <View style={styles.optionContent}>
                                <View style={[styles.optionCircle, selectedOption === index && styles.optionCircleSelected]}>
                                    {selectedOption === index && <View style={styles.optionCircleInner} />}
                                </View>
                                <Text style={[styles.optionText, selectedOption === index && styles.optionTextSelected]}>
                                    {String.fromCharCode(65 + index)}. {option}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={[styles.navButton, (currentQuestionIndex === 0 || submitting) && styles.navButtonDisabled]}
                    onPress={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0 || submitting}
                >
                    <Text style={[styles.navButtonText, (currentQuestionIndex === 0 || submitting) && styles.navButtonTextDisabled]}>← Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, (currentQuestionIndex === examData.questions.length - 1 || submitting) && styles.navButtonDisabled]}
                    onPress={goToNextQuestion}
                    disabled={currentQuestionIndex === examData.questions.length - 1 || submitting}
                >
                    <Text style={[styles.navButtonText, (currentQuestionIndex === examData.questions.length - 1 || submitting) && styles.navButtonTextDisabled]}>Next →</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={() => handleSubmitExam(false)} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Exam</Text>}
            </TouchableOpacity>

            {
                submitting && (
                    <View style={styles.submittingOverlay}>
                        <View style={styles.submittingBox}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.submittingText}>Submitting exam...</Text>
                        </View>
                    </View>
                )
            }
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    scrollContent: { flex: 1 },
    header: { backgroundColor: '#007AFF', padding: 16, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flex: 1, marginRight: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    difficulty: { fontSize: 11, color: '#fff', opacity: 0.8 },
    timerContainer: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    timerContainerWarning: { backgroundColor: '#ff3b30' },
    timerText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
    offlineBanner: { backgroundColor: '#ff9500', padding: 8, alignItems: 'center' },
    offlineText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    slowConnectionHintTaking: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#f8f9fa', marginHorizontal: 16, borderRadius: 12 },
    slowTextTaking: { marginLeft: 10, color: '#666', fontSize: 14, fontStyle: 'italic' },
    questionIndicator: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    questionNumber: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 8 },
    progressBar: { height: 4, backgroundColor: '#e9ecef', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#007AFF' },
    questionContainer: { backgroundColor: '#fff', padding: 20, margin: 16, marginBottom: 8, borderRadius: 16, borderWidth: 1, borderColor: '#eee', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, position: 'relative' },
    questionText: { fontSize: 18, color: '#333', lineHeight: 26, fontWeight: '500' },
    savingBadge: { position: 'absolute', top: 12, right: 12 },
    optionsContainer: { padding: 16, paddingTop: 8 },
    optionButton: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1.5, borderColor: '#dee2e6' },
    optionButtonSelected: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
    optionContent: { flexDirection: 'row', alignItems: 'center' },
    optionCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#dee2e6', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    optionCircleSelected: { borderColor: '#007AFF' },
    optionCircleInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF' },
    optionText: { fontSize: 16, color: '#495057', flex: 1 },
    optionTextSelected: { color: '#007AFF', fontWeight: 'bold' },
    navigationContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 8, gap: 12 },
    navButton: { flex: 1, backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
    navButtonDisabled: { backgroundColor: '#e9ecef' },
    navButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    navButtonTextDisabled: { color: '#adb5bd' },
    submitButton: { backgroundColor: '#34c759', margin: 16, marginTop: 4, padding: 16, borderRadius: 12, alignItems: 'center', height: 56, justifyContent: 'center' },
    submitButtonDisabled: { backgroundColor: '#acdfb8' },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    submittingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    submittingBox: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
    submittingText: { marginTop: 12, fontSize: 16, color: '#333', fontWeight: 'bold' },
    retryButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginTop: 16 },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },
    errorText: { fontSize: 16, color: '#dc3545' },

    // Skeleton Styles
    skeletonHeader: { height: 100, backgroundColor: '#007AFF' },
    skeletonIndicator: { height: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    skeletonQuestionBox: { height: 120, backgroundColor: '#e9ecef', borderRadius: 16, margin: 16 },
    skeletonOption: { height: 56, backgroundColor: '#e9ecef', borderRadius: 12, marginHorizontal: 16, marginBottom: 12 },
    skeletonNav: { height: 80, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
});
