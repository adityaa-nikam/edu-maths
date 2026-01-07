/**
 * Home Screen (Authenticated)
 * 
 * Main dashboard for students.
 * Placeholder implementation - will add real features later.
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../../store/AuthContext';

export default function HomeScreen() {
    const { student, logout } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.studentName}>{student?.username}!</Text>
                    <Text style={styles.academyName}>{student?.academyName}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <View style={styles.actionCard}>
                        <Text style={styles.actionTitle}>📝 Upcoming Exams</Text>
                        <Text style={styles.actionSubtitle}>
                            Check your scheduled exams
                        </Text>
                        <Text style={styles.placeholder}>
                            (Will show exam list from API)
                        </Text>
                    </View>

                    <View style={styles.actionCard}>
                        <Text style={styles.actionTitle}>📊 Recent Results</Text>
                        <Text style={styles.actionSubtitle}>
                            View your latest scores
                        </Text>
                        <Text style={styles.placeholder}>
                            (Will show results from API)
                        </Text>
                    </View>

                    <View style={styles.actionCard}>
                        <Text style={styles.actionTitle}>📈 Performance</Text>
                        <Text style={styles.actionSubtitle}>
                            Track your progress
                        </Text>
                        <Text style={styles.placeholder}>
                            (Will show analytics from API)
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
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
    welcomeCard: {
        backgroundColor: '#007AFF',
        padding: 24,
        borderRadius: 12,
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    studentName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    academyName: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    actionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    placeholder: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    logoutButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    logoutButtonText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
    },
});
