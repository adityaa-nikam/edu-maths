/**
 * Exam Taking Screen
 * 
 * Full exam interface with questions, timer, and answer submission.
 */

import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api';

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
    const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Track if exam has been submitted to prevent double submission
    const hasSubmittedRef = useRef(false);

    // Fetch questions on load
    useEffect(() => {
        // Reset submission flag when component mounts
        hasSubmittedRef.current = false;
        fetchQuestions();
    }, []);

    // Timer countdown
    useEffect(() => {
        // Don't auto-submit if we're still loading or already submitting
        if (loading || submitting) {
            return;
        }

        // Don't auto-submit if exam data hasn't loaded yet
        if (!examData) {
            return;
        }

        // Don't auto-submit if already submitted
        if (hasSubmittedRef.current) {
            return;
        }

        // Auto-submit when time runs out (but only if we have valid exam data)
        if (timeRemaining <= 0) {
            console.log('⏰ Timer expired - auto-submitting exam');
            handleSubmitExam(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, examData, loading, submitting]);

    const fetchQuestions = async () => {
        setLoading(true);

        try {
            const response = await apiClient.get(`/exams/${params.examId}/questions`);

            if (response.success && response.data) {
                const data = response.data as ExamData;
                setExamData(data);

                // Calculate time remaining
                const startTime = new Date(params.serverStartTime).getTime();
                const duration = parseInt(params.durationMinutes) * 60 * 1000; // to milliseconds
                const endTime = startTime + duration;
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000)); // to seconds

                setTimeRemaining(remaining);

                console.log('✅ Questions loaded:', {
                    totalQuestions: data.totalQuestions,
                    timeRemaining: remaining
                });
            } else {
                Alert.alert('Error', response.error?.message || 'Failed to load questions');
                router.back();
            }
        } catch (error) {
            console.error('❌ Error fetching questions:', error);
            Alert.alert('Error', 'Failed to load exam questions');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = async (optionIndex: number) => {
        if (!examData) return;

        const currentQuestion = examData.questions[currentQuestionIndex];

        // Update local state
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestion.id, optionIndex);
        setAnswers(newAnswers);

        // Auto-save to backend
        try {
            await apiClient.post(`/exams/${params.examId}/answer`, {
                questionId: currentQuestion.id,
                selectedOption: optionIndex
            });
            console.log('✅ Answer saved for question:', currentQuestion.id);
        } catch (error) {
            console.error('❌ Error saving answer:', error);
            // Don't show error to user - we'll save on submit
        }
    };

    const goToNextQuestion = () => {
        if (examData && currentQuestionIndex < examData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitExam = async (autoSubmit: boolean = false) => {
        if (!autoSubmit) {
            // Show confirmation dialog
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
        // Prevent double submission
        if (hasSubmittedRef.current) {
            console.log('⚠️ Exam already submitted, ignoring duplicate submission');
            return;
        }

        // Mark as submitted immediately
        hasSubmittedRef.current = true;
        setSubmitting(true);

        try {
            const response = await apiClient.post(`/exams/${params.examId}/submit`);

            if (response.success && response.data) {
                const data = response.data as any;

                console.log('✅ Exam submitted:', data);

                // Navigate to results screen
                router.replace({
                    pathname: '/(auth)/result',
                    params: {
                        score: data.score.toString(),
                        totalQuestions: data.totalQuestions.toString(),
                        percentage: data.percentage.toString(),
                        examTitle: params.examTitle,
                        autoSubmitted: data.autoSubmitted ? 'true' : 'false'
                    }
                });
            } else {
                Alert.alert('Error', response.error?.message || 'Failed to submit exam');
                // Reset flag if submission failed
                hasSubmittedRef.current = false;
                setSubmitting(false);
            }
        } catch (error) {
            console.error('❌ Error submitting exam:', error);
            Alert.alert('Error', 'Failed to submit exam');
            // Reset flag if submission failed
            hasSubmittedRef.current = false;
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading questions...</Text>
            </View>
        );
    }

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
    const isLowTime = timeRemaining <= 300; // 5 minutes or less

    return (
        <View style={styles.container}>
            {/* Header with Timer */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>{examData.title}</Text>
                    <Text style={styles.difficulty}>
                        {examData.difficulty.toUpperCase()}
                    </Text>
                </View>
                <View style={[styles.timerContainer, isLowTime && styles.timerContainerWarning]}>
                    <Text style={styles.timerText}>
                        ⏱️ {formatTime(timeRemaining)}
                    </Text>
                </View>
            </View>

            {/* Question Indicator */}
            <View style={styles.questionIndicator}>
                <Text style={styles.questionNumber}>
                    Question {currentQuestionIndex + 1} of {examData.totalQuestions}
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentQuestionIndex + 1) / examData.totalQuestions) * 100}%` }
                        ]}
                    />
                </View>
            </View>

            <ScrollView style={styles.scrollContent}>
                {/* Question */}
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                selectedOption === index && styles.optionButtonSelected
                            ]}
                            onPress={() => handleSelectOption(index)}
                        >
                            <View style={styles.optionContent}>
                                <View style={[
                                    styles.optionCircle,
                                    selectedOption === index && styles.optionCircleSelected
                                ]}>
                                    {selectedOption === index && (
                                        <View style={styles.optionCircleInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.optionText,
                                    selectedOption === index && styles.optionTextSelected
                                ]}>
                                    {String.fromCharCode(65 + index)}. {option}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        currentQuestionIndex === 0 && styles.navButtonDisabled
                    ]}
                    onPress={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                >
                    <Text style={[
                        styles.navButtonText,
                        currentQuestionIndex === 0 && styles.navButtonTextDisabled
                    ]}>
                        ← Previous
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.navButton,
                        currentQuestionIndex === examData.questions.length - 1 && styles.navButtonDisabled
                    ]}
                    onPress={goToNextQuestion}
                    disabled={currentQuestionIndex === examData.questions.length - 1}
                >
                    <Text style={[
                        styles.navButtonText,
                        currentQuestionIndex === examData.questions.length - 1 && styles.navButtonTextDisabled
                    ]}>
                        Next →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={styles.submitButton}
                onPress={() => handleSubmitExam(false)}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Submit Exam</Text>
                )}
            </TouchableOpacity>

            {/* Submitting Overlay */}
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
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#c62828',
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
    header: {
        backgroundColor: '#007AFF',
        padding: 16,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    difficulty: {
        fontSize: 11,
        color: '#fff',
        opacity: 0.8,
    },
    timerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timerContainerWarning: {
        backgroundColor: '#ff3b30',
    },
    timerText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    questionIndicator: {
        backgroundColor: '#fff',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    questionNumber: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 6,
    },
    progressBar: {
        height: 3,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    scrollContent: {
        flex: 1,
    },
    questionContainer: {
        backgroundColor: '#fff',
        padding: 16,
        margin: 12,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionText: {
        fontSize: 17,
        color: '#333',
        lineHeight: 24,
        fontWeight: '500',
    },
    optionsContainer: {
        padding: 12,
        paddingTop: 0,
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    optionButtonSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#e3f2fd',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionCircleSelected: {
        borderColor: '#007AFF',
    },
    optionCircleInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    optionTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 8,
        gap: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    navButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#f0f0f0',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    navButtonTextDisabled: {
        color: '#999',
    },
    submitButton: {
        backgroundColor: '#34c759',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    submittingOverlay: {
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
    submittingBox: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 200,
    },
    submittingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
});
