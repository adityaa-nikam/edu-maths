/**
 * Simple API Test Screen
 * 
 * Test API connectivity without complex imports.
 * Access via: /api-test route
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { apiClient } from '../services/api';
import { API_BASE_URL } from '../services/config';

export default function ApiTestScreen() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    const testConnection = async () => {
        setLoading(true);
        setResult('Testing connection...');

        try {
            // Test a public endpoint (academy endpoint)
            const response = await apiClient.get('/academy/aditya-academy');

            if (response.success) {
                setResult(`✅ Success!\n\n${JSON.stringify(response.data, null, 2)}`);
            } else {
                setResult(`❌ Error: ${response.error?.message}\n\nStatus: ${response.error?.statusCode}`);
            }
        } catch (error: any) {
            setResult(`❌ Exception: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>API Configuration Test</Text>
                <Text style={styles.url}>Base URL: {API_BASE_URL}</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={testConnection}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Test Connection</Text>
                    )}
                </TouchableOpacity>

                {result ? (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>{result}</Text>
                    </View>
                ) : (
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoText}>
                            This will test the connection to your backend API.
                            {'\n\n'}
                            Make sure your backend is running on:
                            {'\n'}
                            {API_BASE_URL}
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
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    url: {
        fontSize: 12,
        color: '#666',
        marginBottom: 24,
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resultText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    infoContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#1976d2',
        lineHeight: 20,
    },
});
