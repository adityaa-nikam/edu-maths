# Next Phase: Exam UI Implementation Guide

## Quick Start Guide for Implementing Question Display

This guide will help you implement the exam-taking UI in `exam-taking.tsx`.

## Step 1: Define Interfaces

Add these interfaces at the top of `exam-taking.tsx`:

```typescript
interface Question {
    id: string;
    question: string;
    options: string[];  // Array of 4 options
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

interface Answer {
    questionId: string;
    selectedOption: number;
}
```

## Step 2: Add State Variables

```typescript
const [examData, setExamData] = useState<ExamData | null>(null);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<Map<string, number>>(new Map());
const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
const [loading, setLoading] = useState(true);
```

## Step 3: Fetch Questions on Load

```typescript
useEffect(() => {
    fetchQuestions();
}, []);

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
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to load questions');
            router.back();
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        Alert.alert('Error', 'Failed to load exam questions');
        router.back();
    } finally {
        setLoading(false);
    }
};
```

## Step 4: Implement Timer

```typescript
useEffect(() => {
    if (timeRemaining <= 0) {
        // Auto-submit when time runs out
        handleSubmitExam(true);
        return;
    }
    
    const timer = setInterval(() => {
        setTimeRemaining(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                handleSubmitExam(true);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    
    return () => clearInterval(timer);
}, [timeRemaining]);

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
```

## Step 5: Handle Answer Selection

```typescript
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
        console.log('✅ Answer saved');
    } catch (error) {
        console.error('❌ Error saving answer:', error);
        // Don't show error to user - we'll save on submit
    }
};
```

## Step 6: Navigation Between Questions

```typescript
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
```

## Step 7: Submit Exam

```typescript
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
    try {
        const response = await apiClient.post(`/exams/${params.examId}/submit`);
        
        if (response.success && response.data) {
            const data = response.data as any;
            
            // Navigate to results screen
            router.replace({
                pathname: '/(auth)/result',
                params: {
                    score: data.score.toString(),
                    totalQuestions: data.totalQuestions.toString(),
                    percentage: data.percentage.toString(),
                    examTitle: params.examTitle
                }
            });
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to submit exam');
        }
    } catch (error) {
        console.error('Error submitting exam:', error);
        Alert.alert('Error', 'Failed to submit exam');
    }
};
```

## Step 8: UI Layout

```typescript
if (loading || !examData) {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
    );
}

const currentQuestion = examData.questions[currentQuestionIndex];
const selectedOption = answers.get(currentQuestion.id);

return (
    <View style={styles.container}>
        {/* Header with Timer */}
        <View style={styles.header}>
            <Text style={styles.title}>{examData.title}</Text>
            <View style={styles.timerContainer}>
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
        </View>

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
                    <Text style={[
                        styles.optionText,
                        selectedOption === index && styles.optionTextSelected
                    ]}>
                        {String.fromCharCode(65 + index)}. {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

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
                <Text style={styles.navButtonText}>← Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.navButton,
                    currentQuestionIndex === examData.questions.length - 1 && styles.navButtonDisabled
                ]}
                onPress={goToNextQuestion}
                disabled={currentQuestionIndex === examData.questions.length - 1}
            >
                <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
            style={styles.submitButton}
            onPress={() => handleSubmitExam(false)}
        >
            <Text style={styles.submitButtonText}>Submit Exam</Text>
        </TouchableOpacity>
    </View>
);
```

## Step 9: Add Styles

```typescript
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    timerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    questionIndicator: {
        backgroundColor: '#fff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    questionNumber: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    questionContainer: {
        backgroundColor: '#fff',
        padding: 20,
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    questionText: {
        fontSize: 18,
        color: '#333',
        lineHeight: 26,
    },
    optionsContainer: {
        padding: 16,
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    optionButtonSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#e3f2fd',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    optionTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
    },
    navButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#ccc',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#34c759',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
```

## Testing Checklist

- [ ] Questions load correctly
- [ ] Timer counts down properly
- [ ] Can select answers
- [ ] Answers are saved to backend
- [ ] Navigation works (Next/Previous)
- [ ] Submit confirmation appears
- [ ] Auto-submit works when timer expires
- [ ] Navigate to results after submit
- [ ] Handle network errors gracefully

## API Endpoints to Use

1. **GET** `/api/exams/:examId/questions` - Fetch questions
2. **POST** `/api/exams/:examId/answer` - Save single answer
3. **POST** `/api/exams/:examId/submit` - Submit exam

---

**Ready to implement!** Follow these steps in order for a smooth implementation.
