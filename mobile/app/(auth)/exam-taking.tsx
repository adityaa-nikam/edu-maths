import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api';
import { examSessionManager } from '../../store/examSession';

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
const SkeletonQuestion = () => {
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

    // Back Button and Tab Safety
    useEffect(() => {
        const handleBackAction = () => {
            if (hasSubmittedRef.current) return false;

            Alert.alert('Exit Exam?', 'Are you sure you want to exit? Your progress may not be fully saved.', [
                { text: 'Stay', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => router.replace('/(auth)/(tabs)/exam') },
            ]);
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackAction);

        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (hasSubmittedRef.current) return;
            e.preventDefault();
            Alert.alert('Exit Exam?', 'Are you sure you want to exit? Your progress may not be fully saved.', [
                { text: 'Stay', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
            ]);
        });

        return () => {
            backHandler.remove();
            unsubscribe();
        };
    }, [navigation]);

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

    const fetchQuestions = async (examId: string) => {
        setLoading(true);
        setError(null);
        const session = examSessionManager.getSession();

        try {
            const response = await apiClient.get<ExamData>(`/exams/${examId}/questions`);
            if (response.success && response.data) {
                setExamData(response.data);

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
                setError(response.error?.message || 'Failed to load questions');
            }
        } catch (err) {
            setError('Unable to load exam questions. Please check your connection.');
        } finally {
            setLoading(false);
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

    const handleSelectOption = (optionIndex: number) => {
        if (!examData || submitting) return;

        const currentQuestion = examData.questions[currentQuestionIndex];

        // Update UI immediately (Local State)
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestion.id, optionIndex);
        setAnswers(newAnswers);

        // Debounced API Save
        if (answerDebounceRef.current) clearTimeout(answerDebounceRef.current);

        setSavingAnswer(true);
        answerDebounceRef.current = setTimeout(async () => {
            try {
                const session = examSessionManager.getSession();
                await apiClient.post(`/exams/${session?.examId}/answer`, {
                    questionId: currentQuestion.id,
                    selectedOption: optionIndex
                });
            } catch (err) {
                console.error('❌ Failed to auto-save answer:', err);
                // We don't block the user, but we show a small indicator if needed
            } finally {
                setSavingAnswer(false);
            }
        }, 1000); // 1s debounce
    };

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
                Alert.alert('Error', response.error?.message || 'Failed to submit exam');
                hasSubmittedRef.current = false;
                setSubmitting(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit exam');
            hasSubmittedRef.current = false;
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <SkeletonQuestion />;

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

            {submitting && (
                <View style={styles.submittingOverlay}>
                    <View style={styles.submittingBox}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.submittingText}>Submitting exam...</Text>
                    </View>
                </View>
            )}
        </View>
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
