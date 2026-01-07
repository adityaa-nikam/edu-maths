/**
 * Result Screen (Authenticated)
 * 
 * Shows student's exam results and performance.
 * Placeholder implementation - will connect to API later.
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../store/AuthContext';

// Placeholder result data
const PLACEHOLDER_RESULTS = [
    {
        id: '1',
        examTitle: 'Speed Calculation Challenge',
        difficulty: 'medium',
        score: 85,
        totalQuestions: 20,
        correctAnswers: 17,
        submittedAt: '2026-01-08T14:45:00Z',
    },
    {
        id: '2',
        examTitle: 'Basic Abacus Test',
        difficulty: 'easy',
        score: 95,
        totalQuestions: 15,
        correctAnswers: 14,
        submittedAt: '2026-01-06T11:30:00Z',
    },
    {
        id: '3',
        examTitle: 'Mental Math Basics',
        difficulty: 'easy',
        score: 78,
        totalQuestions: 10,
        correctAnswers: 8,
        submittedAt: '2026-01-03T10:15:00Z',
    },
];

export default function ResultScreen() {
    const { student } = useAuth();

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#34c759';
        if (score >= 70) return '#ff9500';
        return '#ff3b30';
    };

    const getGrade = (score: number) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    };

    const calculateAverage = () => {
        if (PLACEHOLDER_RESULTS.length === 0) return 0;
        const sum = PLACEHOLDER_RESULTS.reduce((acc, result) => acc + result.score, 0);
        return Math.round(sum / PLACEHOLDER_RESULTS.length);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Performance Summary</Text>
                    <View style={styles.summaryStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{PLACEHOLDER_RESULTS.length}</Text>
                            <Text style={styles.statLabel}>Exams Taken</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: getScoreColor(calculateAverage()) }]}>
                                {calculateAverage()}%
                            </Text>
                            <Text style={styles.statLabel}>Average Score</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{getGrade(calculateAverage())}</Text>
                            <Text style={styles.statLabel}>Grade</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        📊 Placeholder data shown below
                    </Text>
                    <Text style={styles.infoText}>
                        Will load from API: GET /api/student/results
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Recent Results</Text>

                {PLACEHOLDER_RESULTS.map((result) => (
                    <View key={result.id} style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <View style={styles.resultTitleContainer}>
                                <Text style={styles.resultTitle}>{result.examTitle}</Text>
                                <Text style={styles.resultDate}>
                                    {new Date(result.submittedAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.scoreBadge,
                                    { backgroundColor: getScoreColor(result.score) },
                                ]}
                            >
                                <Text style={styles.scoreText}>{result.score}%</Text>
                            </View>
                        </View>

                        <View style={styles.resultDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Difficulty:</Text>
                                <Text style={styles.detailValue}>
                                    {result.difficulty.toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Correct Answers:</Text>
                                <Text style={styles.detailValue}>
                                    {result.correctAnswers} / {result.totalQuestions}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Grade:</Text>
                                <Text
                                    style={[
                                        styles.detailValue,
                                        { color: getScoreColor(result.score), fontWeight: 'bold' },
                                    ]}
                                >
                                    {getGrade(result.score)}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.viewButton}>
                            <Text style={styles.viewButtonText}>View Details</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {PLACEHOLDER_RESULTS.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No results yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Complete an exam to see your results here
                        </Text>
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
    content: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#007AFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#fff',
        opacity: 0.3,
    },
    infoBox: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 12,
        color: '#1976d2',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    resultCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    resultTitleContainer: {
        flex: 1,
        marginRight: 12,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    resultDate: {
        fontSize: 12,
        color: '#666',
    },
    scoreBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    resultDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        width: 120,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    viewButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#007AFF',
        fontSize: 14,
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
});
